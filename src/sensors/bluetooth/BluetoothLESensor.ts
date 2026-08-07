export interface IBluetoothLESensor
{
    get name(): string;
    start(characteristic: string, valueChangedCallback: (value: DataView) => void): void;
    stop() : void;
    onDisconnected: (() => void) | null;
}

export class BluetoothLESensor implements IBluetoothLESensor
{
    public onDisconnected: () => void = () => {};

    public constructor(private nativeDevice: BluetoothDevice, private serviceUuid: string)
    {
        nativeDevice.ongattserverdisconnected = ev => {
            console.log("Bluetooth device disconnected");
            console.log(ev);
            if (this.onDisconnected != null)
                this.onDisconnected();
        }
    }

    get name(): string 
    {
        return this.nativeDevice.name ?? "<No Name>";
    }

    async start(characteristic : string, valueChangedCallback : (value : DataView) => void): Promise<void>
    {
        try
        {
            console.log('Connecting to GATT Server...');
            const server = await this.nativeDevice.gatt?.connect();
    
            console.log('Getting Service for ' + this.serviceUuid);
            let service: BluetoothRemoteGATTService | undefined;
            try {
                service = await server?.getPrimaryService(this.serviceUuid);
            } catch (err) {
                console.warn(`Could not get primary service '${this.serviceUuid}', trying fallback UUIDs...`, err);
                if (this.serviceUuid === "fitness_machine" || this.serviceUuid === "0x1826") {
                    try {
                        service = await server?.getPrimaryService(0x1826);
                    } catch {
                        service = await server?.getPrimaryService("00001826-0000-1000-8000-00805f9b34fb");
                    }
                } else if (this.serviceUuid === "heart_rate" || this.serviceUuid === "0x180D") {
                    try {
                        service = await server?.getPrimaryService(0x180d);
                    } catch {
                        service = await server?.getPrimaryService("0000180d-0000-1000-8000-00805f9b34fb");
                    }
                } else {
                    throw err;
                }
            }
            
            console.log('Getting Characteristic for ' + characteristic);
            let myCharacteristic: BluetoothRemoteGATTCharacteristic | undefined;
            try {
                myCharacteristic = await service?.getCharacteristic(characteristic);
            } catch (err) {
                console.warn(`Could not get characteristic '${characteristic}', trying fallback UUIDs...`, err);
                if (characteristic === "0x2acd" || characteristic === "treadmill_data") {
                    try {
                        myCharacteristic = await service?.getCharacteristic(0x2acd);
                    } catch {
                        myCharacteristic = await service?.getCharacteristic("00002acd-0000-1000-8000-00805f9b34fb");
                    }
                } else if (characteristic === "heart_rate_measurement" || characteristic === "0x2a37") {
                    try {
                        myCharacteristic = await service?.getCharacteristic(0x2a37);
                    } catch {
                        myCharacteristic = await service?.getCharacteristic("00002a37-0000-1000-8000-00805f9b34fb");
                    }
                } else {
                    throw err;
                }
            }

            console.log("Starting notifications...");
            await myCharacteristic?.startNotifications();

            console.log("Notifications started");

            myCharacteristic?.addEventListener('characteristicvaluechanged', (event: Event) => 
            {
                var data = (event.target as BluetoothRemoteGATTCharacteristic)?.value;
                if (data != null)
                    valueChangedCallback(data);
            });
        }
        catch (error)
        {
            console.error("There was a problem listening this Sensor for " + characteristic, error);
            throw error;
        }
    }

    stop(): void 
    {
        console.log("disconnect");
        this.nativeDevice?.gatt?.disconnect();
    }
}