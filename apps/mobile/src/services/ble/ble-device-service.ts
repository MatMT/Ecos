import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';

export interface BleScanOptions {
  serviceUuid?: string;
  serviceUuids?: string[];
  deviceName?: string;
  deviceNames?: string[];
}

export class BleDeviceService {
  private static instance: BleDeviceService | null = null;
  private manager: BleManager | null = null;

  private constructor() {
    try {
      if (Platform.OS === 'web' || (!NativeModules.BleClient && !NativeModules.BleClientManager)) {
        this.manager = null;
        return;
      }
      this.manager = new BleManager();
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

  public startScan(
    options: BleScanOptions,
    onDeviceFound: (device: Device) => void,
    onError: (error: Error) => void
  ): void {
    if (!this.manager) {
      onError(new Error('El módulo Bluetooth no está disponible en este entorno de desarrollo.'));
      return;
    }

    const serviceUuids = options.serviceUuids
      ? options.serviceUuids
      : options.serviceUuid
      ? [options.serviceUuid]
      : null;

    this.manager.startDeviceScan(serviceUuids, null, (error, device) => {
      if (error) {
        onError(error);
        return;
      }

      if (!device) {
        return;
      }

      if (options.deviceNames && options.deviceNames.length > 0) {
        if (!device.name || !options.deviceNames.includes(device.name)) {
          return;
        }
      } else if (options.deviceName && device.name !== options.deviceName) {
        return;
      }

      onDeviceFound(device);
    });
  }

  public stopScan(): void {
    if (!this.manager) {
      return;
    }
    this.manager.stopDeviceScan();
  }

  public async connect(
    device: Device,
    onDisconnected: (error: Error | null) => void
  ): Promise<Device> {
    const connectedDevice = await device.connect();
    await connectedDevice.discoverAllServicesAndCharacteristics();

    connectedDevice.onDisconnected((error) => {
      onDisconnected(error);
    });

    return connectedDevice;
  }

  public monitorCharacteristic(
    device: Device,
    serviceUuid: string,
    characteristicUuid: string,
    onData: (value: string) => void,
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
          const decoded = Buffer.from(characteristic.value, 'base64').toString('utf-8');
          onData(decoded);
        }
      }
    );
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

  public async disconnect(device: Device): Promise<void> {
    const isConnected = await device.isConnected();
    if (isConnected) {
      await device.cancelConnection();
    }
  }

  public destroy(): void {
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
    BleDeviceService.instance = null;
  }
}
