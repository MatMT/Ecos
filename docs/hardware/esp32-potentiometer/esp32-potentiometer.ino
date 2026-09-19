#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Standard Heart Rate Service & Characteristic UUIDs (Customized payload)
#define SERVICE_UUID        "0000180d-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "00002a37-0000-1000-8000-00805f9b34fb"

// Pin configuration for Dual-Potentiometer Bench Test
const int bpmPotPin = 34;       // Channel 1: Heart Rate (BPM: 45 - 190)
const int activityPotPin = 35;  // Channel 2: Physical Activity (0 - 100%)
const int ledHeartbeatPin = 22; // Heartbeat visual indicator
const int ledAlertPin = 23;     // Resting tachycardia alert LED

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

// Packed binary structure (Fixed length: 6 Bytes)
struct __attribute__((packed)) NexoTelemetryPacket {
    uint8_t  bpm;             // 45 - 190 BPM
    uint8_t  activity_level;  // 0 - 100 %
    uint8_t  spo2;            // 0 - 100 % (simulated 98% nominal)
    uint16_t step_delta;      // Steps accumulator delta
    uint8_t  flags;           // Bit 0: Hardware Alert, Bit 1: SOS Button, Bit 2: Low Battery
};

class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) override {
      deviceConnected = true;
    }
    void onDisconnect(BLEServer* pServer) override {
      deviceConnected = false;
      pServer->getAdvertising()->start();
    }
};

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // 12-bit ADC (0 - 4095)

  pinMode(bpmPotPin, INPUT);
  pinMode(activityPotPin, INPUT);
  pinMode(ledHeartbeatPin, OUTPUT);
  pinMode(ledAlertPin, OUTPUT);

  BLEDevice::init("Nexo-Band-ESP32");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();

  Serial.println("Nexo Band BLE ready. Awaiting connection...");
}

void loop() {
  if (deviceConnected) {
    // 1. Read raw ADC values (0 - 4095)
    int rawBpm = analogRead(bpmPotPin);
    int rawActivity = analogRead(activityPotPin);

    // 2. Map to physiological ranges
    // BPM: 45 to 190 BPM
    uint8_t mappedBpm = map(rawBpm, 0, 4095, 45, 190);
    // Activity: 0 to 100%
    uint8_t mappedActivity = map(rawActivity, 0, 4095, 0, 100);

    // 3. Flags and indicators
    uint8_t flags = 0;
    // Hardware anomaly detection: Resting tachycardia (BPM > 110 with Activity < 15%)
    bool isRestingTachycardia = (mappedBpm > 110 && mappedActivity < 15);
    if (isRestingTachycardia) {
      flags |= 0x01; // Bit 0: Hardware Alert
      digitalWrite(ledAlertPin, HIGH);
    } else {
      digitalWrite(ledAlertPin, LOW);
    }

    // Blink heartbeat LED
    digitalWrite(ledHeartbeatPin, HIGH);

    // 4. Build binary packet (6 Bytes)
    NexoTelemetryPacket packet;
    packet.bpm = mappedBpm;
    packet.activity_level = mappedActivity;
    packet.spo2 = 98;
    packet.step_delta = mappedActivity > 20 ? (uint16_t)(mappedActivity / 10) : 0;
    packet.flags = flags;

    pCharacteristic->setValue((uint8_t*)&packet, sizeof(packet));
    pCharacteristic->notify();

    digitalWrite(ledHeartbeatPin, LOW);

    Serial.print("Telemetry sent - BPM: ");
    Serial.print(mappedBpm);
    Serial.print(" | Activity: ");
    Serial.print(mappedActivity);
    Serial.print("% | Flags: 0x");
    Serial.println(flags, HEX);
  }

  delay(1000); // 1 Hz sampling frequency
}
