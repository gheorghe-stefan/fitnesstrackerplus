
export abstract class BluetoothClient
{
    public onDisconnected: (() => void) | null = null;

    public constructor(protected nativeDevice: BluetoothDevice)
    {
        nativeDevice.ongattserverdisconnected = ev => {
            // console.log("Bluetooth device disconnected");
            // console.log(ev);
            if (this.onDisconnected != null)
                this.onDisconnected();
        }
    }

    async connect()
    {
        try
        {
            // console.log('Connecting to GATT Server...');
            const server = await this.nativeDevice.gatt?.connect();
            
            if (server)
                await this.connected(server);
        }
        catch (ex: any)
        {
            // console.log("There was a problem connecting for the service", ex);
        }
    }

    protected abstract connected(service: BluetoothRemoteGATTServer): Promise<void>;

    disconnect(): void 
    {
        // console.log("disconnect");
        this.nativeDevice?.gatt?.disconnect();
    }
}