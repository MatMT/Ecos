#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ============================================================================
// ECOS BAND SIMULATOR - ESP32 Hardware Firmware
// Wearable Biometric Telemetry & Autonomic Decoupling Simulator
// ============================================================================

// --- Configuración Pantalla OLED ---
#define ANCHO_PANTALLA 128
#define ALTO_PANTALLA 64
#define DIRECCION_OLED 0x3C
Adafruit_SSD1306 oled(ANCHO_PANTALLA, ALTO_PANTALLA, &Wire, -1);

// --- Configuración BLE ---
#define SERVICE_UUID        "0000180d-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "00002a37-0000-1000-8000-00805f9b34fb"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool dispositivoConectado = false;

struct __attribute__((packed)) NexoTelemetryPacket {
  uint8_t  bpm;            // 45 - 190 BPM
  uint8_t  activity_level; // 0 - 100%
  uint8_t  spo2;           // 98% nominal
  uint16_t step_delta;     // Pasos acumulados
  uint8_t  flags;          // Bit 0: Hardware Alert (Desacople Autonómico / Pánico)
};

// --- Asignación de Pines ESP32 ---
const int pinPotBpm    = 34; // Potenciómetro BPM (G34)
const int pinPotAct    = 35; // Potenciómetro Actividad (G35)
const int pinLedLatido = 4;  // LED de latido fisiológico (G4)

unsigned long ultimoLatido = 0;
unsigned long ultimoRefrescoOled = 0;
unsigned long ultimaTelemetria = 0;
bool latidoActivo = false;

// Bitmap de corazón 8x8 px
static const unsigned char PROGMEM iconoCorazon[] = {
  0b01100110, 0b11111111, 0b11111111, 0b11111111,
  0b01111110, 0b00111100, 0b00011000, 0b00000000
};

class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    dispositivoConectado = true;
  }
  void onDisconnect(BLEServer* pServer) override {
    dispositivoConectado = false;
    BLEDevice::startAdvertising();
  }
};

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // ADC a 12 bits (0 - 4095)

  pinMode(pinPotBpm, INPUT);
  pinMode(pinPotAct, INPUT);
  pinMode(pinLedLatido, OUTPUT);
  digitalWrite(pinLedLatido, LOW);

  // Inicializar I2C (SDA = G21, SCL = G22)
  Wire.begin(21, 22);
  if (!oled.begin(SSD1306_SWITCHCAPVCC, DIRECCION_OLED)) {
    Serial.println("Error al detectar pantalla OLED");
  }

  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_WHITE);
  oled.setCursor(6, 28);
  oled.println("ECOS BAND SIMULATOR");
  oled.display();

  // Inicializar Servidor BLE
  BLEDevice::init("Ecos-Band-ESP32");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06); // Parámetros recomendados para compatibilidad iOS
  pAdvertising->setMinPreferred(0x12);

  // Anuncio primario: Nombre del dispositivo (17 bytes <= 31 bytes)
  BLEAdvertisementData advData;
  advData.setName("Ecos-Band-ESP32");
  pAdvertising->setAdvertisementData(advData);

  // Respuesta de escaneo (Scan Response): UUID del servicio (18 bytes <= 31 bytes)
  BLEAdvertisementData scanData;
  scanData.setCompleteServices(BLEUUID(SERVICE_UUID));
  pAdvertising->setScanResponseData(scanData);

  BLEDevice::startAdvertising();

  Serial.println("BLE publicando como 'Ecos-Band-ESP32' (ECOS BAND SIMULATOR)");
  delay(1000);
}

void loop() {
  // 1. Lecturas analógicas de 12 bits
  int rawBpm = analogRead(pinPotBpm);
  int rawAct = analogRead(pinPotAct);

  // 2. Mapeo a escalas biométricas
  uint8_t bpm = map(rawBpm, 0, 4095, 45, 190);
  uint8_t actividad = map(rawAct, 0, 4095, 0, 100);

  // 3. Control de latido fisiológico en pin G4
  unsigned long periodoLatido = 60000UL / bpm;
  if (millis() - ultimoLatido >= periodoLatido) {
    ultimoLatido = millis();
    latidoActivo = true;
    digitalWrite(pinLedLatido, HIGH);
  }
  if (latidoActivo && (millis() - ultimoLatido >= 35)) {
    latidoActivo = false;
    digitalWrite(pinLedLatido, LOW);
  }

  // 4. Detección de desacople autonómico (Estrés agudo / Pánico en reposo)
  bool alertaPanico = (bpm > 115 && actividad < 20);

  // 5. Refresco de pantalla OLED (10 Hz - cada 100 ms)
  if (millis() - ultimoRefrescoOled >= 100) {
    ultimoRefrescoOled = millis();
    oled.clearDisplay();

    // Encabezado dinámico
    if (alertaPanico) {
      oled.fillRect(0, 0, 128, 12, SSD1306_WHITE);
      oled.setTextColor(SSD1306_BLACK);
      oled.setCursor(2, 2);
      oled.print("!ESTRES / ALERTA!");
    } else {
      oled.drawRect(0, 0, 128, 12, SSD1306_WHITE);
      oled.setTextColor(SSD1306_WHITE);
      oled.setCursor(4, 2);
      oled.print(dispositivoConectado ? "BLE: CONECTADO" : "BLE: ESPERANDO...");
    }

    // Corazón gráfico animado
    oled.setTextColor(SSD1306_WHITE);
    if (millis() - ultimoLatido < 120) {
      oled.drawBitmap(116, 2, iconoCorazon, 8, 8, alertaPanico ? SSD1306_BLACK : SSD1306_WHITE);
    }

    // Valores biométricos
    oled.setCursor(0, 17);
    oled.setTextSize(1);
    oled.print("PULSO CARDIACO:");

    oled.setCursor(0, 28);
    oled.setTextSize(2);
    oled.print(bpm);
    oled.setTextSize(1);
    oled.print(" BPM");

    oled.setCursor(0, 45);
    oled.print("Actividad: ");
    oled.print(actividad);
    oled.print("%");

    // Barra horizontal inferior de actividad
    int anchoBarra = map(actividad, 0, 100, 0, 124);
    oled.drawRoundRect(0, 56, 128, 7, 2, SSD1306_WHITE);
    if (anchoBarra > 0) {
      oled.fillRoundRect(2, 58, anchoBarra, 3, 1, SSD1306_WHITE);
    }
    oled.display();
  }

  // 6. Emisión de paquete BLE cada segundo (1 Hz)
  if (millis() - ultimaTelemetria >= 1000) {
    ultimaTelemetria = millis();

    NexoTelemetryPacket paquete;
    paquete.bpm = bpm;
    paquete.activity_level = actividad;
    paquete.spo2 = 98;
    paquete.step_delta = actividad > 20 ? (uint16_t)(actividad / 10) : 0;
    paquete.flags = alertaPanico ? 0x01 : 0x00;

    if (dispositivoConectado) {
      pCharacteristic->setValue((uint8_t*)&paquete, sizeof(paquete));
      pCharacteristic->notify();
    }

    Serial.print("[ESP32] BPM: ");
    Serial.print(bpm);
    Serial.print(" | Actividad: ");
    Serial.print(actividad);
    Serial.print("% | Flags: 0x");
    Serial.println(paquete.flags, HEX);
  }

  // Ceder brevemente tiempo de CPU al planificador FreeRTOS para el stack BLE
  delay(10);
}
