import { ISensor } from '../domain/ISensor';
import { TreadmillData } from '../domain/TreadmillData';
import { BluetoothLESensor } from "./bluetooth/BluetoothLESensor";
import { HRBluetoothSensor } from "./bluetooth/BluetoothSensors";
import { TreadmillBluetoothSensor } from "./bluetooth/TreadmillBluetoothSensor";
import VirtualSensors from "./VirtualSensors";

export class SensorManager
{    
    public static UseVirtualSensors: boolean = false;

    private _HRSensor: ISensor<number> | null = null;
    public get HRSensor(): ISensor<number> | null { return this._HRSensor; }

    private _TreadmillSensor: ISensor<TreadmillData> | null = null;
    public get TreadmillSensor(): ISensor<TreadmillData> | null { return this._TreadmillSensor; }
    
    async SearchHRSensor(): Promise<ISensor<number>>
    {
        if (SensorManager.UseVirtualSensors)
        {
            this._HRSensor = VirtualSensors.HRSensor;
        }
        else
        {
            const bluetoothDevice = await this.SearchDevice("heart_rate");
            const bluetoothSensor = new BluetoothLESensor(bluetoothDevice, "heart_rate");
            this._HRSensor = new HRBluetoothSensor(bluetoothSensor);
        }
 
        return this._HRSensor;
    }

    async SearchTreadmillSensor(): Promise<ISensor<TreadmillData>>
    {
        if (SensorManager.UseVirtualSensors)
        {
            this._TreadmillSensor = VirtualSensors.TreadmillSensor;
        }
        else
        {
            // 0x1826 is standard FTMS (Fitness Machine Service)
            const bluetoothDevice = await this.SearchDevice("fitness_machine", ["00001826-0000-1000-8000-00805f9b34fb"]);
            const bluetoothSensor = new BluetoothLESensor(bluetoothDevice, "fitness_machine");
            this._TreadmillSensor = new TreadmillBluetoothSensor(bluetoothSensor);
        }

        return this._TreadmillSensor;
    }

    private async SearchDevice(serviceUuid: string | number, optionalServices?: (string | number)[]) : Promise<BluetoothDevice>
    {
        console.log('Requesting Bluetooth Device with service ' + serviceUuid);
        const nativeDevice = await navigator.bluetooth.requestDevice({filters: [{services: [serviceUuid]}], optionalServices: optionalServices});
        return nativeDevice;
    }
}
