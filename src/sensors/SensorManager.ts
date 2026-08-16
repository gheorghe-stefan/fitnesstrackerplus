import { ISensor } from '../domain/ISensor';
import { TreadmillData } from '../domain/TreadmillData';
import { BluetoothLESensor } from "./bluetooth/BluetoothLESensor";
import { HRBluetoothSensor } from "./bluetooth/BluetoothSensors";
import { SportstechF37sBluetoothSensor } from "./bluetooth/TreadmillBluetoothSensor";
import VirtualSensors from "./VirtualSensors";

export class SensorManager
{    
    public static UseVirtualSensors: boolean = new URLSearchParams(window.location.search).get('mock') === '1';

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
            const bluetoothDevice = await this.SearchTreadmillDevice();
            const bluetoothSensor = new BluetoothLESensor(bluetoothDevice, "fitness_machine");
            this._TreadmillSensor = new SportstechF37sBluetoothSensor(bluetoothSensor);
        }

        return this._TreadmillSensor;
    }

    private async SearchTreadmillDevice(): Promise<BluetoothDevice>
    {
        console.log('Requesting Bluetooth Device for Treadmill (acceptAllDevices: true)...');
        return await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                "fitness_machine",
                0x1826,
                "00001826-0000-1000-8000-00805f9b34fb",
                0xfff0,
                "0000fff0-0000-1000-8000-00805f9b34fb",
                "heart_rate",
                0x180d,
                "0000180d-0000-1000-8000-00805f9b34fb",
            ],
        });
    }

    private async SearchDevice(serviceUuid: string | number, optionalServices?: (string | number)[]) : Promise<BluetoothDevice>
    {
        console.log('Requesting Bluetooth Device with service ' + serviceUuid);
        const nativeDevice = await navigator.bluetooth.requestDevice({filters: [{services: [serviceUuid]}], optionalServices: optionalServices});
        return nativeDevice;
    }
}
