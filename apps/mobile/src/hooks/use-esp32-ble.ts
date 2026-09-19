import { useState, useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import {
  BleDeviceService,
  type BleConnectionStatus,
  type BleTelemetryState,
  type ScannedDevice,
} from '@/services/ble/ble-device-service';

export type { BleConnectionStatus, BleTelemetryState, ScannedDevice };

export interface UseEsp32BleResult extends BleTelemetryState {
  startScanAndConnect: () => Promise<void>;
  startScanOnly: () => Promise<void>;
  stopScan: () => void;
  connectToDeviceId: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  openSettings: () => Promise<void>;
}

export function useEsp32Ble(): UseEsp32BleResult {
  const bleService = BleDeviceService.getInstance();
  const [state, setState] = useState<BleTelemetryState>(bleService.getState());

  useEffect(() => {
    const unsubscribe = bleService.subscribe((updatedState) => {
      setState(updatedState);
    });
    return unsubscribe;
  }, [bleService]);

  const startScanAndConnect = useCallback(async () => {
    await bleService.startScanAndConnect();
  }, [bleService]);

  const startScanOnly = useCallback(async () => {
    await bleService.startScanOnly();
  }, [bleService]);

  const stopScan = useCallback(() => {
    bleService.stopScan();
  }, [bleService]);

  const connectToDeviceId = useCallback(
    async (deviceId: string) => {
      await bleService.connectToDeviceId(deviceId);
    },
    [bleService]
  );

  const disconnect = useCallback(async () => {
    await bleService.disconnectCurrent();
  }, [bleService]);

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      // Ignored
    }
  }, []);

  return {
    ...state,
    startScanAndConnect,
    startScanOnly,
    stopScan,
    connectToDeviceId,
    disconnect,
    openSettings,
  };
}
