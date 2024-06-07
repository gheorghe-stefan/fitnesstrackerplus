import { ISensor } from "../SensorManager";
import { IBluetoothLESensor } from "./BluetoothLESensor";
import { BluetoothUtils } from "./BluetoothUtils";

class BluetoothSensorBase
{
    public constructor(public bluetoothLESensor: IBluetoothLESensor) { }

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
            const flags = data.getUint8(0);
            const hr = data.getUint8(1);
            notification(hr);
        });
    }
}
