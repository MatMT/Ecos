import { useState, useEffect, useCallback } from 'react';
import {
  BleDeviceService,
  type BleConnectionStatus,
  type BleTelemetryState,
} from '@/services/ble/ble-device-service';

export type { BleConnectionStatus, BleTelemetryState };

export interface UseEsp32BleResult extends BleTelemetryState {
  startScanAndConnect: () => Promise<void>;
  disconnect: () => Promise<void>;
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

  const disconnect = useCallback(async () => {
    await bleService.disconnectCurrent();
  }, [bleService]);

  return {
    ...state,
    startScanAndConnect,
    disconnect,
  };
}
