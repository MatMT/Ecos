import { useState, useEffect, useRef, useCallback } from 'react';
import { Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { BleDeviceService } from '@/services/ble/ble-device-service';
import { BLE_CONFIG } from '@/constants/ble';

export type BleConnectionStatus =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnected';

export interface UseEsp32BleResult {
  status: BleConnectionStatus;
  bpm: number;
  activityLevel: number;
  spo2: number;
  stepDelta: number;
  flags: number;
  hardwareAlert: boolean;
  sosPressed: boolean;
  lowBattery: boolean;
  rawAdcValue: number;
  percentage: number;
  connectedDeviceName: string | null;
  errorMessage: string | null;
  startScanAndConnect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useEsp32Ble(): UseEsp32BleResult {
  const [status, setStatus] = useState<BleConnectionStatus>('idle');
  const [bpm, setBpm] = useState<number>(0);
  const [activityLevel, setActivityLevel] = useState<number>(0);
  const [spo2, setSpo2] = useState<number>(98);
  const [stepDelta, setStepDelta] = useState<number>(0);
  const [flags, setFlags] = useState<number>(0);
  const [hardwareAlert, setHardwareAlert] = useState<boolean>(false);
  const [sosPressed, setSosPressed] = useState<boolean>(false);
  const [lowBattery, setLowBattery] = useState<boolean>(false);
  const [rawAdcValue, setRawAdcValue] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(0);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deviceRef = useRef<Device | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bleService = BleDeviceService.getInstance();

  const clearScanTimeout = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  }, []);

  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const disconnect = useCallback(async () => {
    clearScanTimeout();
    bleService.stopScan();
    cleanupSubscription();

    if (deviceRef.current) {
      try {
        await bleService.disconnect(deviceRef.current);
      } catch {
        // Ignored during disconnection teardown
      } finally {
        deviceRef.current = null;
      }
    }

    setStatus('disconnected');
    setConnectedDeviceName(null);
  }, [bleService, clearScanTimeout, cleanupSubscription]);

  const handleBinaryUpdate = useCallback((buffer: Buffer) => {
    if (buffer.length >= BLE_CONFIG.packetSizeBytes) {
      const parsedBpm = buffer.readUInt8(0);
      const parsedActivity = buffer.readUInt8(1);
      const parsedSpo2 = buffer.readUInt8(2);
      const parsedSteps = buffer.readUInt16LE(3);
      const parsedFlags = buffer.readUInt8(5);

      setBpm(parsedBpm);
      setActivityLevel(parsedActivity);
      setSpo2(parsedSpo2);
      setStepDelta(parsedSteps);
      setFlags(parsedFlags);

      const hasAlert = (parsedFlags & BLE_CONFIG.flags.hardwareAlert) !== 0;
      const hasSos = (parsedFlags & BLE_CONFIG.flags.sosButton) !== 0;
      const hasLowBat = (parsedFlags & BLE_CONFIG.flags.lowBattery) !== 0;

      setHardwareAlert(hasAlert);
      setSosPressed(hasSos);
      setLowBattery(hasLowBat);

      // Backwards compatibility for rawAdc / percentage
      const estimatedAdc = Math.round((parsedBpm / 190) * BLE_CONFIG.maxAdcValue);
      setRawAdcValue(estimatedAdc);
      setPercentage(parsedActivity);
    } else {
      // If payload is short, attempt ASCII decoding fallback
      const text = buffer.toString('utf-8');
      const numericValue = parseInt(text, 10);
      if (!isNaN(numericValue)) {
        const clampedValue = Math.max(0, Math.min(numericValue, BLE_CONFIG.maxAdcValue));
        const calculatedPercentage = Math.round((clampedValue / BLE_CONFIG.maxAdcValue) * 100);
        setRawAdcValue(clampedValue);
        setPercentage(calculatedPercentage);
        const mappedBpm = Math.round(45 + (clampedValue / BLE_CONFIG.maxAdcValue) * (190 - 45));
        setBpm(mappedBpm);
        setActivityLevel(calculatedPercentage);
      }
    }
  }, []);

  const startScanAndConnect = useCallback(async () => {
    await disconnect();
    setErrorMessage(null);

    if (!bleService.isAvailable()) {
      setStatus('error');
      setErrorMessage('El módulo Bluetooth no está disponible en este entorno de ejecución (se requiere un cliente de desarrollo nativo con soporte BLE).');
      return;
    }

    const hasPermission = await bleService.requestPermissions();
    if (!hasPermission) {
      setStatus('error');
      setErrorMessage('No se han otorgado los permisos necesarios para la comunicación por Bluetooth.');
      return;
    }

    setStatus('scanning');

    scanTimeoutRef.current = setTimeout(() => {
      bleService.stopScan();
      setStatus('error');
      setErrorMessage('No se ha localizado el dispositivo en el tiempo límite asignado.');
    }, BLE_CONFIG.scanTimeoutMs);

    bleService.startScan(
      {
        deviceNames: [BLE_CONFIG.deviceName, ...BLE_CONFIG.fallbackDeviceNames, BLE_CONFIG.legacyDeviceName],
        serviceUuids: [BLE_CONFIG.serviceUuid, BLE_CONFIG.legacyServiceUuid],
      },
      async (device) => {
        clearScanTimeout();
        bleService.stopScan();
        setStatus('connecting');

        try {
          const connected = await bleService.connect(device, () => {
            cleanupSubscription();
            deviceRef.current = null;
            setStatus('disconnected');
            setConnectedDeviceName(null);
            setErrorMessage('Se ha interrumpido la conexión con el dispositivo ESP32.');
          });

          deviceRef.current = connected;
          setConnectedDeviceName(connected.name ?? BLE_CONFIG.deviceName);
          setStatus('connected');

          // Try monitoring modern standard service first, with legacy fallback
          try {
            subscriptionRef.current = bleService.monitorBinaryCharacteristic(
              connected,
              BLE_CONFIG.serviceUuid,
              BLE_CONFIG.characteristicUuid,
              (buf) => handleBinaryUpdate(buf),
              () => {
                // Fallback to legacy characteristic if standard fails
                subscriptionRef.current = bleService.monitorBinaryCharacteristic(
                  connected,
                  BLE_CONFIG.legacyServiceUuid,
                  BLE_CONFIG.legacyCharacteristicUuid,
                  (legacyBuf) => handleBinaryUpdate(legacyBuf),
                  () => {
                    setStatus('error');
                    setErrorMessage('Ha ocurrido un error en la recepción de telemetría del dispositivo.');
                  }
                );
              }
            );
          } catch {
            subscriptionRef.current = bleService.monitorBinaryCharacteristic(
              connected,
              BLE_CONFIG.legacyServiceUuid,
              BLE_CONFIG.legacyCharacteristicUuid,
              (legacyBuf) => handleBinaryUpdate(legacyBuf),
              () => {
                setStatus('error');
                setErrorMessage('Ha ocurrido un error en la recepción de telemetría del dispositivo.');
              }
            );
          }
        } catch {
          setStatus('error');
          setErrorMessage('No fue posible establecer la conexión con el dispositivo ESP32.');
        }
      },
      () => {
        clearScanTimeout();
        setStatus('error');
        setErrorMessage('Ha ocurrido un error durante la búsqueda de dispositivos Bluetooth.');
      }
    );
  }, [
    bleService,
    clearScanTimeout,
    cleanupSubscription,
    disconnect,
    handleBinaryUpdate,
  ]);

  useEffect(() => {
    return () => {
      clearScanTimeout();
      bleService.stopScan();
      cleanupSubscription();
      if (deviceRef.current) {
        bleService.disconnect(deviceRef.current).catch(() => {});
      }
    };
  }, [bleService, clearScanTimeout, cleanupSubscription]);

  return {
    status,
    bpm,
    activityLevel,
    spo2,
    stepDelta,
    flags,
    hardwareAlert,
    sosPressed,
    lowBattery,
    rawAdcValue,
    percentage,
    connectedDeviceName,
    errorMessage,
    startScanAndConnect,
    disconnect,
  };
}

