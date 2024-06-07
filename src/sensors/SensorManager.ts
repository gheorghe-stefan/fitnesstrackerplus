import { BluetoothLESensor, IBluetoothLESensor } from "./bluetooth/BluetoothLESensor";
import { HRBluetoothSensor } from "./bluetooth/BluetoothSensors";
import VirtualSensors from "./VirtualSensors";

export class SensorManager
{    
    public static UseVirtualSensors: boolean = false;

    private _HRSensor: ISensor<number> | null = null;
    public get HRSensor(): ISensor<number> | null { return this._HRSensor; }
    
    async SearchHRSensor(): Promise<ISensor<number>>
    {
        if (SensorManager.UseVirtualSensors)
        {
            //this._HRSensor = new FakeHRSensor();
            this._HRSensor = VirtualSensors.HRSensor;
        }
        else
        {
            let bluetoothDevice = await this.SearchDevice("heart_rate");
            const bluetoothSensor = new BluetoothLESensor(bluetoothDevice, "heart_rate");
            this._HRSensor = new HRBluetoothSensor(bluetoothSensor);
        }
 
        return this._HRSensor;
    }

    private async SearchDevice(serviceUuid: string, optionalServices?: string[]) : Promise<BluetoothDevice>
    {
        console.log('Requesting Bluetooth Device with service ' + serviceUuid);
        const nativeDevice = await navigator.bluetooth.requestDevice({filters: [{services: [serviceUuid]}], optionalServices: optionalServices});
        return nativeDevice;
    }
}

export interface ISensor<Data>
{
    get name(): string;
    onDisconnected: (() => void) | null;
    start(notification: (data: Data) => void): Promise<void>
    disconnect(): void;
}
