import { ISensor } from '../../domain/ISensor';
import { TreadmillData } from '../../domain/TreadmillData';
import { IBluetoothLESensor } from './BluetoothLESensor';
import { parseFTMSTreadmillData } from './FTMSTreadmillDataParser';

export class BluetoothSensorBase {
  public constructor(protected bluetoothLESensor: IBluetoothLESensor) {
    this.bluetoothLESensor.onDisconnected = () => {
      this.onDisconnected?.();
    };
  }

  get name(): string {
    return this.bluetoothLESensor.name;
  }

  public onDisconnected: (() => void) | null = null;

  disconnect(): void {
    this.bluetoothLESensor.stop();
  }
}

/**
 * BLE sensor implementation for FTMS-compliant treadmills (e.g. Sportstech F37s).
 * Subscribes to the Treadmill Data characteristic (0x2ACD / "treadmill_data")
 * and parses raw telemetry frames.
 */
export class TreadmillBluetoothSensor
  extends BluetoothSensorBase
  implements ISensor<TreadmillData>
{
  async start(notification: (data: TreadmillData) => void): Promise<void> {
    // 0x2ACD is the standardized FTMS Treadmill Data characteristic UUID
    await this.bluetoothLESensor.start('0x2acd', (dataView: DataView) => {
      const parsedData = parseFTMSTreadmillData(dataView);
      notification(parsedData);
    });
  }
}
