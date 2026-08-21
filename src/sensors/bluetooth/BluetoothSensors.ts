import { ISensor } from "../../domain/ISensor";
import { IBluetoothLESensor } from "./BluetoothLESensor";

export class BluetoothSensorBase
{
    public constructor(protected bluetoothLESensor: IBluetoothLESensor)
    {
        // Wire BLE-level disconnect events to the sensor-level callback
        this.bluetoothLESensor.onDisconnected = () => {
            this.onDisconnected?.();
        };
    }

    get id(): string { return this.bluetoothLESensor.id; }
    get name(): string { return this.bluetoothLESensor.name; }

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
            if (!data || data.byteLength < 2) return;

            const flags = data.getUint8(0);
            const is16Bit = (flags & 0x01) !== 0;
            let hr = 0;

            if (is16Bit) {
                if (data.byteLength >= 3) {
                    hr = data.getUint16(1, true); // little-endian
                }
            } else {
                hr = data.getUint8(1);
            }

            notification(hr);
        });
    }
}
