export const BLE_CONFIG = {
  deviceName: 'Ecos-Band-ESP32',
  fallbackDeviceNames: ['Nexo-Band-ESP32'] as const,
  legacyDeviceName: 'ESP32-Potentiometer',
  serviceUuid: '0000180d-0000-1000-8000-00805f9b34fb',
  characteristicUuid: '00002a37-0000-1000-8000-00805f9b34fb',
  legacyServiceUuid: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  legacyCharacteristicUuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  scanTimeoutMs: 15000,
  maxAdcValue: 4095,
  packetSizeBytes: 6,
  flags: {
    hardwareAlert: 0x01,
    sosButton: 0x02,
    lowBattery: 0x04,
  },
} as const;

