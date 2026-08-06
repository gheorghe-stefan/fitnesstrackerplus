import { ISensor } from '../../domain/ISensor';
import { TreadmillData } from '../../domain/TreadmillData';
import { IBluetoothLESensor } from './BluetoothLESensor';
import { parseFTMSTreadmillData } from './FTMSTreadmillDataParser';
import { ITreadmillProfile, SportstechF37sProfile } from './TreadmillProfiles';

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
 * BLE sensor implementation for FTMS-compliant treadmills.
 * Accepts a pluggable ITreadmillProfile strategy (defaults to Sportstech F37s).
 */
export class TreadmillBluetoothSensor
  extends BluetoothSensorBase
  implements ISensor<TreadmillData>
{
  public constructor(
    bluetoothLESensor: IBluetoothLESensor,
    private profile: ITreadmillProfile = SportstechF37sProfile
  ) {
    super(bluetoothLESensor);
  }

  async start(notification: (data: TreadmillData) => void): Promise<void> {
    await this.bluetoothLESensor.start('0x2acd', (dataView: DataView) => {
      const parsedData = parseFTMSTreadmillData(dataView, this.profile);
      notification(parsedData);
    });
  }
}

/**
 * Concrete subclass specifically for Sportstech F37s treadmill.
 */
export class SportstechF37sBluetoothSensor extends TreadmillBluetoothSensor {
  public constructor(bluetoothLESensor: IBluetoothLESensor) {
    super(bluetoothLESensor, SportstechF37sProfile);
  }
}
