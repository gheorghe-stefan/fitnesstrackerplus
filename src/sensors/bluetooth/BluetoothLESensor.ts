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
    
            console.log('Getting Service...');
            const service = await server?.getPrimaryService(this.serviceUuid);
            
            console.log('Getting Characteristic...');
            const myCharacteristic = await service?.getCharacteristic(characteristic);

            console.log("Starting notifications...");
            await myCharacteristic?.startNotifications();

            console.log("Notifications started");

            myCharacteristic?.addEventListener('characteristicvaluechanged', (event: Event) => 
            {
                //console.log(event);
                var data = (event.target as BluetoothRemoteGATTCharacteristic)?.value;
                //console.log(data);  
                if (data != null)
                    valueChangedCallback(data);
            });
        }
        catch
        {
            console.log("There was a problem listening this Sensor for " + characteristic);
        }
    }

    stop(): void 
    {
        console.log("disconnect");
        this.nativeDevice?.gatt?.disconnect();
    }
}