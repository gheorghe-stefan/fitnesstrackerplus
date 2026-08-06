import { ISensor } from "../../domain/ISensor";
import { IBluetoothLESensor } from "./BluetoothLESensor";

class BluetoothSensorBase
{
    public constructor(protected bluetoothLESensor: IBluetoothLESensor)
    {
        // Wire BLE-level disconnect events to the sensor-level callback
        this.bluetoothLESensor.onDisconnected = () => {
            this.onDisconnected?.();
        };
    }

    get name(): string { return this.bluetoothLESensor.name }

    public onDisconnected: (() => void) | null = null;

    disconnect()
    {
        this.bluetoothLESensor.stop();
    }
}

export class HRBluetoothSensor extends BluetoothSensorBase implements ISensor<number>
{
    async start(notification: (hr: number) => void): Promise<void>
    {
        await this.bluetoothLESensor.start("heart_rate_measurement", data =>
        {
            const hr = data.getUint8(1);
            notification(hr);
        });
    }
}
