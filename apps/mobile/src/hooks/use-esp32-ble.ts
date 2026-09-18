import { useState, useEffect, useRef, useCallback } from 'react';
import { Device, Subscription } from 'react-native-ble-plx';
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
  rawAdcValue: number;
  percentage: number;
  connectedDeviceName: string | null;
  errorMessage: string | null;
  startScanAndConnect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useEsp32Ble(): UseEsp32BleResult {
  const [status, setStatus] = useState<BleConnectionStatus>('idle');
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

  const handleCharacteristicUpdate = useCallback((value: string) => {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      const clampedValue = Math.max(0, Math.min(numericValue, BLE_CONFIG.maxAdcValue));
      const calculatedPercentage = Math.round((clampedValue / BLE_CONFIG.maxAdcValue) * 100);
      setRawAdcValue(clampedValue);
      setPercentage(calculatedPercentage);
    }
  }, []);

  const startScanAndConnect = useCallback(async () => {
    await disconnect();
    setErrorMessage(null);

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
        deviceName: BLE_CONFIG.deviceName,
        serviceUuid: BLE_CONFIG.serviceUuid,
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

          subscriptionRef.current = bleService.monitorCharacteristic(
            connected,
            BLE_CONFIG.serviceUuid,
            BLE_CONFIG.characteristicUuid,
            (val) => handleCharacteristicUpdate(val),
            () => {
              setStatus('error');
              setErrorMessage('Ha ocurrido un error en la recepción de telemetría del dispositivo.');
            }
          );
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
    handleCharacteristicUpdate,
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
    rawAdcValue,
    percentage,
    connectedDeviceName,
    errorMessage,
    startScanAndConnect,
    disconnect,
  };
}
