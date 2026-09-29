import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';

import { BLE_CONFIG } from '@/constants/ble';
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from '@/services/api/secure-session-storage';

export type BleConnectionStatus =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnected';

export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  serviceUUIDs: string[] | null;
  isCompatible: boolean;
}

export interface BleTelemetryState {
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
  discoveredDevices: ScannedDevice[];
  bondedDeviceId: string | null;
  bondedDeviceName: string | null;
  isReconnecting: boolean;
}

export interface BleScanOptions {
  serviceUuid?: string;
  serviceUuids?: string[];
  deviceName?: string;
  deviceNames?: string[];
}

export interface PairedBandRecord {
  id: string;
  name: string;
  pairedAt: string;
}

const PAIRED_BAND_KEY = 'ecos_paired_band_device';

export class BleDeviceService {
  private static instance: BleDeviceService | null = null;
  private manager: BleManager | null = null;

  private state: BleTelemetryState = {
    status: 'idle',
    bpm: 0,
    activityLevel: 0,
    spo2: 98,
    stepDelta: 0,
    flags: 0,
    hardwareAlert: false,
    sosPressed: false,
    lowBattery: false,
    rawAdcValue: 0,
    percentage: 0,
    connectedDeviceName: null,
    errorMessage: null,
    discoveredDevices: [],
    bondedDeviceId: null,
    bondedDeviceName: null,
    isReconnecting: false,
  };

  private listeners = new Set<(state: BleTelemetryState) => void>();
  private activeDevice: Device | null = null;
  private activeSubscription: Subscription | null = null;
  private scanTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private discoveredDevicesMap = new Map<string, ScannedDevice>();

  private bondedDeviceId: string | null = null;
  private bondedDeviceName: string | null = null;
  private isManualDisconnect: boolean = false;
  private isReconnecting: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private autoReconnectScanTimer: ReturnType<typeof setTimeout> | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    try {
      if (Platform.OS === 'web') {
        this.manager = null;
        return;
      }
      this.manager = new BleManager();
      this.manager.onStateChange((adapterState) => {
        if (
          adapterState === 'PoweredOn' &&
          this.bondedDeviceId &&
          !this.activeDevice &&
          !this.isManualDisconnect
        ) {
          void this.attemptReconnect();
        }
      });
    } catch {
      this.manager = null;
    }
  }

  public static getInstance(): BleDeviceService {
    if (!BleDeviceService.instance) {
      BleDeviceService.instance = new BleDeviceService();
    }
    return BleDeviceService.instance;
  }

  public isAvailable(): boolean {
    return this.manager !== null;
  }

  public getState(): BleTelemetryState {
    return this.state;
  }

  public subscribe(listener: (state: BleTelemetryState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<BleTelemetryState>): void {
    this.state = { ...this.state, ...partial };
    for (const fn of this.listeners) {
      fn(this.state);
    }
  }

  /**
   * Initializes paired bond record from SecureStore and attempts auto-reconnect if present.
   */
  public async initBondedState(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    try {
      const raw = await getSecureItem(PAIRED_BAND_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PairedBandRecord;
        if (parsed?.id) {
          this.bondedDeviceId = parsed.id;
          this.bondedDeviceName = parsed.name || BLE_CONFIG.deviceName;
          this.updateState({
            bondedDeviceId: this.bondedDeviceId,
            bondedDeviceName: this.bondedDeviceName,
          });

          if (!this.activeDevice && !this.isManualDisconnect) {
            void this.attemptReconnect();
          }
        }
      }
    } catch {
      // Non-critical local load error ignored
    }
  }

  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    const apiLevel = Number(Platform.Version);

    if (apiLevel >= 31) {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      return (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  private async waitForAdapterReady(): Promise<void> {
    if (!this.manager) {
      throw new Error('El módulo Bluetooth no está disponible en este entorno de ejecución.');
    }

    try {
      const currentState = await this.manager.state();
      if (currentState === 'PoweredOn') {
        return;
      }
    } catch {
      // Ignored and proceed to state change listener
    }

    return new Promise<void>((resolve, reject) => {
      let resolved = false;
      const subscription = this.manager!.onStateChange((adapterState) => {
        if (adapterState === 'PoweredOn') {
          if (!resolved) {
            resolved = true;
            subscription.remove();
            resolve();
          }
        } else if (adapterState === 'Unauthorized') {
          if (!resolved) {
            resolved = true;
            subscription.remove();
            reject(new Error('Permiso de Bluetooth no otorgado. Por favor, habilite el acceso a Bluetooth en los Ajustes de su dispositivo.'));
          }
        } else if (adapterState === 'Unsupported') {
          if (!resolved) {
            resolved = true;
            subscription.remove();
            reject(new Error('El hardware Bluetooth Low Energy no es compatible en este dispositivo.'));
          }
        }
      }, true);

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          subscription.remove();
          resolve();
        }
      }, 1500);
    });
  }

  public startScan(
    options: BleScanOptions,
    onDeviceFound: (device: Device) => void,
    onError: (error: Error) => void
  ): void {
    if (!this.manager) {
      onError(new Error('El módulo Bluetooth no está disponible en este entorno de ejecución.'));
      return;
    }

    this.discoveredDevicesMap.clear();

    void this.manager
      .connectedDevices([
        BLE_CONFIG.serviceUuid,
        '180d',
        '180D',
        '0000180d-0000-1000-8000-00805f9b34fb',
        BLE_CONFIG.legacyServiceUuid,
      ])
      .then((alreadyConnected) => {
        if (alreadyConnected && alreadyConnected.length > 0) {
          for (const dev of alreadyConnected) {
            const resolvedName = (dev.localName?.trim() || dev.name?.trim()) || BLE_CONFIG.deviceName;
            this.discoveredDevicesMap.set(dev.id, {
              id: dev.id,
              name: resolvedName,
              rssi: -45,
              serviceUUIDs: dev.serviceUUIDs,
              isCompatible: true,
            });
          }
          this.updateState({
            discoveredDevices: Array.from(this.discoveredDevicesMap.values()),
          });
        }
      })
      .catch(() => {
        // Handled
      });

    this.updateState({ discoveredDevices: Array.from(this.discoveredDevicesMap.values()) });

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('[BLE SCAN ERROR]', error.message);
        onError(error);
        return;
      }

      if (!device) {
        return;
      }

      const rawName = (device.localName?.trim() || device.name?.trim() || '');
      const serviceUUIDs = device.serviceUUIDs ?? [];

      const hasMatchingService = serviceUUIDs.some((uuid) => {
        const u = uuid.toLowerCase();
        return (
          u.includes('180d') ||
          u === BLE_CONFIG.serviceUuid.toLowerCase() ||
          u === BLE_CONFIG.legacyServiceUuid.toLowerCase()
        );
      });

      const hasEcosystemName =
        rawName.length > 0 &&
        !rawName.startsWith('Dispositivo BLE') &&
        (rawName.startsWith('Ecos-Band') ||
          rawName.startsWith('Nexo-Band') ||
          rawName.startsWith('ESP32') ||
          (options.deviceNames &&
            options.deviceNames.some((n) => rawName.toLowerCase().includes(n.toLowerCase()))));

      if (!hasMatchingService && !hasEcosystemName) {
        return;
      }

      const displayName = rawName.length > 0 ? rawName : (hasMatchingService ? BLE_CONFIG.deviceName : null);
      if (!displayName || displayName.startsWith('Dispositivo BLE')) {
        return;
      }

      this.discoveredDevicesMap.set(device.id, {
        id: device.id,
        name: displayName,
        rssi: device.rssi ?? null,
        serviceUUIDs: device.serviceUUIDs,
        isCompatible: true,
      });

      const sortedList = Array.from(this.discoveredDevicesMap.values()).sort((a, b) => {
        const aIsTarget = a.name === BLE_CONFIG.deviceName || a.name?.startsWith('Ecos-Band');
        const bIsTarget = b.name === BLE_CONFIG.deviceName || b.name?.startsWith('Ecos-Band');
        if (aIsTarget && !bIsTarget) return -1;
        if (!aIsTarget && bIsTarget) return 1;
        return (b.rssi ?? -100) - (a.rssi ?? -100);
      });

      this.updateState({ discoveredDevices: sortedList });
      onDeviceFound(device);
    });
  }

  public stopScan(clearDiscovered = true): void {
    if (this.scanTimeoutTimer) {
      clearTimeout(this.scanTimeoutTimer);
      this.scanTimeoutTimer = null;
    }
    if (this.autoReconnectScanTimer) {
      clearTimeout(this.autoReconnectScanTimer);
      this.autoReconnectScanTimer = null;
    }
    if (this.manager) {
      try {
        this.manager.stopDeviceScan();
      } catch {
        // Handled
      }
    }
    if (clearDiscovered) {
      this.discoveredDevicesMap.clear();
      this.updateState({
        status: this.state.status === 'scanning' ? 'idle' : this.state.status,
        discoveredDevices: [],
      });
    } else if (this.state.status === 'scanning') {
      this.updateState({ status: 'idle' });
    }
  }

  public async startScanOnly(): Promise<void> {
    if (this.state.status === 'connected') {
      await this.disconnectCurrent();
    }
    this.updateState({ status: 'scanning', errorMessage: null });

    if (!this.isAvailable()) {
      this.updateState({
        status: 'error',
        errorMessage: 'El módulo Bluetooth no está disponible en este entorno de ejecución.',
      });
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      this.updateState({
        status: 'error',
        errorMessage: 'Permisos de Bluetooth no otorgados en los Ajustes del sistema.',
      });
      return;
    }

    try {
      await this.waitForAdapterReady();
    } catch (err) {
      this.updateState({
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Error al verificar el estado de Bluetooth.',
      });
      return;
    }

    if (this.scanTimeoutTimer) {
      clearTimeout(this.scanTimeoutTimer);
    }

    this.scanTimeoutTimer = setTimeout(() => {
      this.stopScan();
    }, 20000);

    this.startScan(
      {
        deviceNames: [BLE_CONFIG.deviceName, ...BLE_CONFIG.fallbackDeviceNames, BLE_CONFIG.legacyDeviceName],
      },
      () => {
        // Discovered devices are updated into state in real time
      },
      (err) => {
        this.updateState({
          status: 'error',
          errorMessage: err.message,
        });
      }
    );
  }

  public async connectToDeviceId(deviceId: string): Promise<void> {
    this.stopScan(false);
    this.updateState({ status: 'connecting', errorMessage: null });

    try {
      if (!this.manager) {
        throw new Error('El módulo Bluetooth no está disponible en este entorno de ejecución.');
      }

      const connected = await this.manager.connectToDevice(deviceId);
      await connected.discoverAllServicesAndCharacteristics();

      const targetName =
        connected.name ??
        this.discoveredDevicesMap.get(deviceId)?.name ??
        BLE_CONFIG.deviceName;

      await this.handleDeviceConnected(connected, targetName);
    } catch (err) {
      this.updateState({
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'No fue posible establecer la conexión con el dispositivo.',
      });
    }
  }

  /**
   * Internal handler invoked whenever connection is established and characteristics are discovered.
   * Persists bonding into SecureStore, cleans up scan artifacts, and binds disconnection recovery.
   */
  private async handleDeviceConnected(connected: Device, name: string): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.autoReconnectScanTimer) {
      clearTimeout(this.autoReconnectScanTimer);
      this.autoReconnectScanTimer = null;
    }

    this.activeDevice = connected;
    this.bondedDeviceId = connected.id;
    this.bondedDeviceName = name;
    this.isManualDisconnect = false;
    this.isReconnecting = false;
    this.discoveredDevicesMap.clear();

    // Persist paired device into SecureStore
    await setSecureItem(
      PAIRED_BAND_KEY,
      JSON.stringify({
        id: connected.id,
        name,
        pairedAt: new Date().toISOString(),
      })
    );

    // Register hardware disconnection listener for automatic reconnection recovery
    connected.onDisconnected(() => {
      this.cleanupSubscription();
      this.activeDevice = null;

      const shouldAutoReconnect = Boolean(this.bondedDeviceId && !this.isManualDisconnect);

      this.updateState({
        status: shouldAutoReconnect ? 'connecting' : 'disconnected',
        connectedDeviceName: null,
        isReconnecting: shouldAutoReconnect,
        errorMessage: this.isManualDisconnect
          ? null
          : 'Se ha interrumpido la conexión. Reconectando automáticamente...',
      });

      if (shouldAutoReconnect) {
        this.scheduleAutoReconnect(2000);
      }
    });

    this.updateState({
      status: 'connected',
      connectedDeviceName: name,
      bondedDeviceId: connected.id,
      bondedDeviceName: name,
      isReconnecting: false,
      discoveredDevices: [],
      errorMessage: null,
    });

    await this.setupTelemetrySubscription(connected);
  }

  /**
   * Schedules an automatic reconnection attempt with exponential/periodic polling.
   */
  private scheduleAutoReconnect(delayMs = 2500): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (!this.bondedDeviceId || this.isManualDisconnect || this.activeDevice) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      void this.attemptReconnect();
    }, delayMs);
  }

  /**
   * Attempts automatic reconnection to previously paired hardware using targeted scan.
   */
  public async attemptReconnect(): Promise<void> {
    if (!this.bondedDeviceId || this.isManualDisconnect || this.activeDevice) {
      return;
    }

    if (this.isReconnecting) {
      return;
    }
    this.isReconnecting = true;

    this.updateState({
      status: 'connecting',
      isReconnecting: true,
      errorMessage: null,
    });

    try {
      if (!this.isAvailable()) {
        return;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return;
      }

      await this.waitForAdapterReady();
      if (!this.manager) return;

      // 1. Check if device is already connected at OS level
      try {
        const isConn = await this.manager.isDeviceConnected(this.bondedDeviceId);
        if (isConn) {
          const knownDevices = await this.manager.devices([this.bondedDeviceId]);
          if (knownDevices.length > 0) {
            const dev = knownDevices[0];
            await dev.discoverAllServicesAndCharacteristics();
            await this.handleDeviceConnected(
              dev,
              dev.name || this.bondedDeviceName || BLE_CONFIG.deviceName
            );
            return;
          }
        }
      } catch {
        // Proceed to targeted scan
      }

      // 2. Perform targeted scan to detect peripheral advertising
      this.startBondedTargetedScan();
    } catch {
      this.scheduleAutoReconnect(3000);
    } finally {
      this.isReconnecting = false;
    }
  }

  /**
   * Runs a targeted scan to locate the bonded peripheral and connects once advertised.
   */
  private startBondedTargetedScan(): void {
    if (!this.manager || !this.bondedDeviceId || this.isManualDisconnect || this.activeDevice) {
      return;
    }

    if (this.autoReconnectScanTimer) {
      clearTimeout(this.autoReconnectScanTimer);
      this.autoReconnectScanTimer = null;
    }

    try {
      this.manager.stopDeviceScan();
    } catch {
      // Handled
    }

    this.manager.startDeviceScan(null, null, async (error, device) => {
      if (error || !device) return;

      const rawName = (device.localName?.trim() || device.name?.trim() || '');
      const isTargetId = device.id === this.bondedDeviceId;
      const isTargetName =
        rawName === BLE_CONFIG.deviceName ||
        rawName.startsWith('Ecos-Band') ||
        rawName.startsWith('Nexo-Band') ||
        (this.bondedDeviceName != null && rawName === this.bondedDeviceName);

      if (isTargetId || isTargetName) {
        if (this.autoReconnectScanTimer) {
          clearTimeout(this.autoReconnectScanTimer);
          this.autoReconnectScanTimer = null;
        }

        try {
          this.manager?.stopDeviceScan();
        } catch {
          // Handled
        }

        try {
          const connected = await device.connect();
          await connected.discoverAllServicesAndCharacteristics();
          await this.handleDeviceConnected(
            connected,
            rawName.length > 0 ? rawName : (this.bondedDeviceName || BLE_CONFIG.deviceName)
          );
        } catch {
          try {
            await device.cancelConnection();
          } catch {
            // Handled
          }
          this.scheduleAutoReconnect(2500);
        }
      }
    });

    this.autoReconnectScanTimer = setTimeout(() => {
      try {
        this.manager?.stopDeviceScan();
      } catch {
        // Handled
      }
      this.autoReconnectScanTimer = null;

      if (!this.activeDevice && this.bondedDeviceId && !this.isManualDisconnect) {
        this.scheduleAutoReconnect(2500);
      }
    }, 6000);
  }

  /**
   * Explicitly unpairs the current hardware, wiping persistent bond and releasing connection.
   */
  public async unpair(): Promise<void> {
    this.isManualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.autoReconnectScanTimer) {
      clearTimeout(this.autoReconnectScanTimer);
      this.autoReconnectScanTimer = null;
    }

    this.bondedDeviceId = null;
    this.bondedDeviceName = null;

    try {
      await deleteSecureItem(PAIRED_BAND_KEY);
    } catch {
      // Handled
    }

    await this.disconnectCurrent();

    this.updateState({
      status: 'idle',
      bpm: 0,
      activityLevel: 0,
      spo2: 0,
      flags: 0,
      hardwareAlert: false,
      sosPressed: false,
      connectedDeviceName: null,
      bondedDeviceId: null,
      bondedDeviceName: null,
      isReconnecting: false,
      discoveredDevices: [],
      errorMessage: null,
    });
  }

  /**
   * Disconnects the active BLE session without wiping the persistent bond in SecureStore.
   * Prevents background auto-reconnect loops while the session is logged out.
   */
  public async disconnectSession(): Promise<void> {
    this.isManualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.autoReconnectScanTimer) {
      clearTimeout(this.autoReconnectScanTimer);
      this.autoReconnectScanTimer = null;
    }

    await this.disconnectCurrent();

    this.updateState({
      status: 'disconnected',
      bpm: 0,
      activityLevel: 0,
      spo2: 0,
      flags: 0,
      hardwareAlert: false,
      sosPressed: false,
      connectedDeviceName: null,
      isReconnecting: false,
      discoveredDevices: [],
      errorMessage: null,
    });
  }

  /**
   * Resumes connection to a bonded device when an authenticated session is restored.
   */
  public resumeBondedConnection(): void {
    this.isManualDisconnect = false;
    if (
      this.bondedDeviceId &&
      !this.activeDevice &&
      this.state.status !== 'connected' &&
      this.state.status !== 'connecting'
    ) {
      void this.attemptReconnect();
    }
  }

  public monitorBinaryCharacteristic(
    device: Device,
    serviceUuid: string,
    characteristicUuid: string,
    onData: (buffer: Buffer) => void,
    onError: (error: Error) => void
  ): Subscription {
    return device.monitorCharacteristicForService(
      serviceUuid,
      characteristicUuid,
      (error, characteristic) => {
        if (error) {
          onError(error);
          return;
        }

        if (characteristic?.value) {
          const buffer = Buffer.from(characteristic.value, 'base64');
          onData(buffer);
        }
      }
    );
  }

  public async startScanAndConnect(): Promise<void> {
    await this.disconnectCurrent();
    this.updateState({ status: 'scanning', errorMessage: null });

    if (!this.isAvailable()) {
      this.updateState({
        status: 'error',
        errorMessage: 'El módulo Bluetooth no está disponible en este entorno de ejecución.',
      });
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      this.updateState({
        status: 'error',
        errorMessage: 'No se han otorgado los permisos necesarios para la comunicación por Bluetooth.',
      });
      return;
    }

    try {
      await this.waitForAdapterReady();
    } catch (err) {
      this.updateState({
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Error al verificar el estado de Bluetooth.',
      });
      return;
    }

    if (this.scanTimeoutTimer) {
      clearTimeout(this.scanTimeoutTimer);
    }

    this.scanTimeoutTimer = setTimeout(() => {
      this.stopScan();
      if (this.state.status === 'scanning') {
        this.updateState({
          status: 'error',
          errorMessage: 'No se ha localizado el dispositivo en el tiempo límite asignado.',
        });
      }
    }, BLE_CONFIG.scanTimeoutMs);

    this.startScan(
      {
        deviceNames: [BLE_CONFIG.deviceName, ...BLE_CONFIG.fallbackDeviceNames, BLE_CONFIG.legacyDeviceName],
      },
      async (device) => {
        if (this.scanTimeoutTimer) {
          clearTimeout(this.scanTimeoutTimer);
          this.scanTimeoutTimer = null;
        }
        this.stopScan();
        this.updateState({ status: 'connecting' });

        try {
          const connected = await device.connect();
          await connected.discoverAllServicesAndCharacteristics();

          await this.handleDeviceConnected(
            connected,
            connected.name ?? BLE_CONFIG.deviceName
          );
        } catch (err) {
          this.updateState({
            status: 'error',
            errorMessage: err instanceof Error ? err.message : 'Error al conectar con el dispositivo.',
          });
        }
      },
      (err) => {
        if (this.scanTimeoutTimer) {
          clearTimeout(this.scanTimeoutTimer);
          this.scanTimeoutTimer = null;
        }
        this.updateState({
          status: 'error',
          errorMessage: err.message,
        });
      }
    );
  }

  private async setupTelemetrySubscription(device: Device): Promise<void> {
    this.cleanupSubscription();

    const handleBuffer = (buffer: Buffer) => {
      if (buffer.length >= BLE_CONFIG.packetSizeBytes) {
        const parsedBpm = buffer.readUInt8(0);
        const parsedActivity = buffer.readUInt8(1);
        const parsedSpo2 = buffer.readUInt8(2);
        const parsedSteps = buffer.readUInt16LE(3);
        const parsedFlags = buffer.readUInt8(5);

        const hasAlert = (parsedFlags & BLE_CONFIG.flags.hardwareAlert) !== 0;
        const hasSos = (parsedFlags & BLE_CONFIG.flags.sosButton) !== 0;
        const hasLowBat = (parsedFlags & BLE_CONFIG.flags.lowBattery) !== 0;
        const estimatedAdc = Math.round((parsedBpm / 190) * BLE_CONFIG.maxAdcValue);

        this.updateState({
          status: 'connected',
          bpm: parsedBpm,
          activityLevel: parsedActivity,
          spo2: parsedSpo2,
          stepDelta: parsedSteps,
          flags: parsedFlags,
          hardwareAlert: hasAlert,
          sosPressed: hasSos,
          lowBattery: hasLowBat,
          rawAdcValue: estimatedAdc,
          percentage: parsedActivity,
          errorMessage: null,
        });
      } else {
        const text = buffer.toString('utf-8');
        const numericValue = parseInt(text, 10);
        if (!isNaN(numericValue)) {
          const clampedValue = Math.max(0, Math.min(numericValue, BLE_CONFIG.maxAdcValue));
          const calculatedPercentage = Math.round((clampedValue / BLE_CONFIG.maxAdcValue) * 100);
          const mappedBpm = Math.round(45 + (clampedValue / BLE_CONFIG.maxAdcValue) * (190 - 45));
          this.updateState({
            status: 'connected',
            bpm: mappedBpm,
            activityLevel: calculatedPercentage,
            rawAdcValue: clampedValue,
            percentage: calculatedPercentage,
            errorMessage: null,
          });
        }
      }
    };

    try {
      const services = await device.services();
      let targetCharacteristic = null;

      // 1. Explicit search for Service 180D and Characteristic 2A37
      for (const service of services) {
        const sUuid = service.uuid.toLowerCase();
        if (sUuid.includes('180d') || sUuid === BLE_CONFIG.serviceUuid.toLowerCase()) {
          const characteristics = await service.characteristics();
          for (const char of characteristics) {
            const cUuid = char.uuid.toLowerCase();
            if (cUuid.includes('2a37') || cUuid === BLE_CONFIG.characteristicUuid.toLowerCase()) {
              targetCharacteristic = char;
              break;
            }
          }
        }
        if (targetCharacteristic) break;
      }

      // 2. Fallback search for any notifiable/indicatable characteristic
      if (!targetCharacteristic) {
        for (const service of services) {
          const characteristics = await service.characteristics();
          for (const char of characteristics) {
            if (char.isNotifiable || char.isIndicatable) {
              targetCharacteristic = char;
              break;
            }
          }
          if (targetCharacteristic) break;
        }
      }

      if (targetCharacteristic) {
        this.activeSubscription = targetCharacteristic.monitor((error, characteristic) => {
          if (error) {
            this.updateState({
              errorMessage: 'Error en la recepción de telemetría del dispositivo.',
            });
            return;
          }
          if (characteristic?.value) {
            const buffer = Buffer.from(characteristic.value, 'base64');
            handleBuffer(buffer);
          }
        });
      } else {
        this.activeSubscription = this.monitorBinaryCharacteristic(
          device,
          BLE_CONFIG.serviceUuid,
          BLE_CONFIG.characteristicUuid,
          handleBuffer,
          () => {
            this.updateState({
              errorMessage: 'Error en la recepción de telemetría del dispositivo.',
            });
          }
        );
      }
    } catch {
      try {
        this.activeSubscription = this.monitorBinaryCharacteristic(
          device,
          BLE_CONFIG.serviceUuid,
          BLE_CONFIG.characteristicUuid,
          handleBuffer,
          () => {
            this.updateState({
              errorMessage: 'Error en la recepción de telemetría del dispositivo.',
            });
          }
        );
      } catch {
        this.updateState({
          errorMessage: 'No fue posible suscribirse a las notificaciones del dispositivo.',
        });
      }
    }
  }

  private cleanupSubscription(): void {
    if (this.activeSubscription) {
      try {
        this.activeSubscription.remove();
      } catch {
        // Handled
      }
      this.activeSubscription = null;
    }
  }

  public async disconnect(device: Device): Promise<void> {
    const isConnected = await device.isConnected();
    if (isConnected) {
      await device.cancelConnection();
    }
  }

  public async disconnectCurrent(): Promise<void> {
    if (this.scanTimeoutTimer) {
      clearTimeout(this.scanTimeoutTimer);
      this.scanTimeoutTimer = null;
    }
    this.stopScan();
    this.cleanupSubscription();

    if (this.activeDevice) {
      try {
        await this.disconnect(this.activeDevice);
      } catch {
        // Handled
      } finally {
        this.activeDevice = null;
      }
    }

    this.updateState({
      status: this.bondedDeviceId && !this.isManualDisconnect ? 'connecting' : 'disconnected',
      connectedDeviceName: null,
    });
  }

  public destroy(): void {
    void this.disconnectCurrent();
    if (this.manager) {
      try {
        this.manager.destroy();
      } catch {
        // Handled
      }
      this.manager = null;
    }
    BleDeviceService.instance = null;
  }
}
