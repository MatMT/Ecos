import os
import json
import torch
import torch.nn as nn
import pandas as pd
from executorch.exir import to_edge

class AnomalyDetector(nn.Module):
    def __init__(self):
        super(AnomalyDetector, self).__init__()
        # Input: 30 features (10 timesteps x 3 features)
        self.encoder = nn.Sequential(
            nn.Linear(30, 16),
            nn.ReLU(),
            nn.Linear(16, 8)
        )
        self.decoder = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, 30)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

def parse_xiaomi_csv(csv_path):
    print(f"Loading real Xiaomi data from {csv_path}...")
    
    # Read the master CSV
    df = pd.read_csv(csv_path)
    
    # Filter only relevant keys
    df = df[df['Key'].isin(['heart_rate', 'stress', 'steps'])]
    
    # Parse the JSON 'Value' column
    def extract_value(row):
        try:
            val_dict = json.loads(row['Value'])
            if row['Key'] == 'heart_rate':
                return val_dict.get('bpm', None)
            elif row['Key'] == 'stress':
                return val_dict.get('stress', None)
            elif row['Key'] == 'steps':
                return val_dict.get('steps', 0)
        except:
            return None
    
    df['ParsedValue'] = df.apply(extract_value, axis=1)
    
    # Pivot the table so we have BPM, Stress, Steps as columns by Time
    pivot_df = df.pivot_table(index='Time', columns='Key', values='ParsedValue', aggfunc='mean')
    
    # Forward fill missing values (e.g. if we have a heart rate but stress was taken 2 mins ago)
    pivot_df = pivot_df.ffill().fillna(0)
    
    # Ensure all 3 columns exist
    for col in ['heart_rate', 'stress', 'steps']:
        if col not in pivot_df.columns:
            pivot_df[col] = 0
            
    # Filter to only keep rows where we have at least heart rate
    pivot_df = pivot_df[pivot_df['heart_rate'] > 0]
    
    print(f"Extracted {len(pivot_df)} valid biometric records for training.")
    
    # Convert to PyTorch Tensor [BPM, Stress, Steps]
    tensor_data = torch.tensor(
        pivot_df[['heart_rate', 'stress', 'steps']].values, 
        dtype=torch.float32
    )
    
    # 1. Normalization
    tensor_data[:, 0] = tensor_data[:, 0] / 220.0 # Max theoretical BPM
    tensor_data[:, 1] = tensor_data[:, 1] / 100.0 # Max stress score
    tensor_data[:, 2] = tensor_data[:, 2] / 200.0 # Max steps per interval
    tensor_data = torch.clamp(tensor_data, 0.0, 1.0)
    
    # 2. Time Windows (Context of 10 readings)
    window_size = 10
    if len(tensor_data) < window_size:
        raise ValueError(f"Not enough data to create a window of size {window_size}")
        
    # unfold creates sliding windows: shape (num_windows, 3 features, 10 timesteps)
    windows = tensor_data.unfold(0, window_size, 1) 
    
    # We want each window flattened as [t0_bpm, t0_stress, t0_steps, t1_bpm, ...]
    # So we transpose to (num_windows, 10 timesteps, 3 features) and then flatten to (num_windows, 30)
    windows = windows.transpose(1, 2).contiguous().view(-1, window_size * 3)
    
    return windows

def train_model(model, data, epochs=100):
    print("Starting training...")
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

    for epoch in range(epochs):
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, data)
        loss.backward()
        optimizer.step()
        
        if (epoch + 1) % 10 == 0:
            print(f"Epoch [{epoch + 1}/{epochs}], Loss: {loss.item():.4f}")
    
    print("Training completed.")

def export_executorch(model, output_path):
    print("Exporting model to ExecuTorch (.pte)...")
    model.eval()
    
    # Example input now has 30 dimensions (10 timesteps * 3 features)
    example_input = (torch.zeros(1, 30, dtype=torch.float32),)
    
    try:
        from torch.export import export
        # 1. Capture the PyTorch program
        exported_program = export(model, example_input)
        # 2. Convert to Edge program
        edge_program = to_edge(exported_program)
        # 3. Compile to ExecuTorch binary
        executorch_program = edge_program.to_executorch()
        
        with open(output_path, "wb") as f:
            f.write(executorch_program.buffer)
        print(f"Model successfully saved to: {output_path}")
    except Exception as e:
        print(f"Export error: {e}")

if __name__ == "__main__":
    os.makedirs("../../apps/patient-app/assets", exist_ok=True)
    
    model = AnomalyDetector()
    
    # Use the real CSV file
    csv_file = "../results/20260828_6514868222_MiFitness_or1_data_copy/20260828_6514868222_MiFitness_hlth_center_fitness_data.csv"
    data = parse_xiaomi_csv(csv_file)
    
    train_model(model, data)
    
    # 3. Calibración del Umbral (Risk Score Calibration)
    model.eval()
    with torch.no_grad():
        reconstructed = model(data)
        # MSE per sample window
        mse_per_sample = torch.mean((reconstructed - data) ** 2, dim=1)
        
        p95 = torch.quantile(mse_per_sample, 0.95)
        p99 = torch.quantile(mse_per_sample, 0.99)
        max_err = torch.max(mse_per_sample)
        
        print("\n--- Risk Score Calibration ---")
        print(f"95th Percentile MSE (Risk Score): {p95.item():.6f}")
        print(f"99th Percentile MSE (Risk Score): {p99.item():.6f}")
        print(f"Max MSE (Risk Score): {max_err.item():.6f}")
        
        suggested_threshold = (p95.item() + p99.item()) / 2
        print(f"Suggested Threshold: {suggested_threshold:.6f}")
        print("------------------------------\n")
        
    export_executorch(model, "../../apps/patient-app/assets/model.pte")
