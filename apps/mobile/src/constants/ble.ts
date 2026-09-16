export const BLE_CONFIG = {
  deviceName: 'ESP32-Potentiometer',
  serviceUuid: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  characteristicUuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  scanTimeoutMs: 10000,
  maxAdcValue: 4095,
} as const;
