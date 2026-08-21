export interface IBluetoothLESensor
{
    get id(): string;
    get name(): string;
    start(characteristic: string, valueChangedCallback: (value: DataView) => void): Promise<void>;
    stop(): Promise<void> | void;
    onDisconnected: (() => void) | null;
}

export class BluetoothLESensor implements IBluetoothLESensor
{
    public onDisconnected: () => void = () => {};
    private activeCharacteristics: BluetoothRemoteGATTCharacteristic[] = [];
    private valueChangedListener: ((event: Event) => void) | null = null;

    public constructor(private nativeDevice: BluetoothDevice, private serviceUuid: string)
    {
        nativeDevice.ongattserverdisconnected = ev => {
            console.log("[BluetoothLESensor] Bluetooth device disconnected event:", ev);
            this.activeCharacteristics = [];
            this.valueChangedListener = null;
            if (this.onDisconnected != null)
                this.onDisconnected();
        }
    }

    get id(): string
    {
        return this.nativeDevice.id;
    }

    get name(): string 
    {
        return this.nativeDevice.name ?? "<No Name>";
    }

    async start(characteristic : string, valueChangedCallback : (value : DataView) => void): Promise<void>
    {
        try
        {
            console.log('[BluetoothLESensor] Connecting to GATT Server...');
            const server = await this.nativeDevice.gatt?.connect();
    
            console.log('[BluetoothLESensor] Getting Service for ' + this.serviceUuid);
            let service: BluetoothRemoteGATTService | undefined;
            try {
                service = await server?.getPrimaryService(this.serviceUuid);
            } catch (err) {
                console.warn(`[BluetoothLESensor] Could not get primary service '${this.serviceUuid}', trying fallback UUIDs...`, err);
                if (this.serviceUuid === "fitness_machine" || this.serviceUuid === "0x1826") {
                    try {
                        service = await server?.getPrimaryService(0x1826);
                    } catch {
                        service = await server?.getPrimaryService("00001826-0000-1000-8000-00805f9b34fb");
                    }
                } else if (this.serviceUuid === "heart_rate" || this.serviceUuid === "0x180D" || this.serviceUuid === "0x180d") {
                    try {
                        service = await server?.getPrimaryService(0x180d);
                    } catch {
                        service = await server?.getPrimaryService("0000180d-0000-1000-8000-00805f9b34fb");
                    }
                } else if (this.serviceUuid === "cycling_power" || this.serviceUuid === "0x1818") {
                    try {
                        service = await server?.getPrimaryService(0x1818);
                    } catch {
                        service = await server?.getPrimaryService("00001818-0000-1000-8000-00805f9b34fb");
                    }
                } else {
                    throw err;
                }
            }
            
            console.log('[BluetoothLESensor] Getting Characteristic for ' + characteristic);
            let myCharacteristic: BluetoothRemoteGATTCharacteristic | undefined;
            try {
                myCharacteristic = await service?.getCharacteristic(characteristic);
            } catch (err) {
                console.warn(`[BluetoothLESensor] Could not get characteristic '${characteristic}', trying fallback UUIDs...`, err);
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
                } else if (characteristic === "cycling_power_measurement" || characteristic === "0x2a63") {
                    try {
                        myCharacteristic = await service?.getCharacteristic(0x2a63);
                    } catch {
                        myCharacteristic = await service?.getCharacteristic("00002a63-0000-1000-8000-00805f9b34fb");
                    }
                } else {
                    throw err;
                }
            }

            if (myCharacteristic) {
                this.activeCharacteristics.push(myCharacteristic);

                this.valueChangedListener = (event: Event) => 
                {
                    var data = (event.target as BluetoothRemoteGATTCharacteristic)?.value;
                    if (data != null)
                        valueChangedCallback(data);
                };

                myCharacteristic.addEventListener('characteristicvaluechanged', this.valueChangedListener);
            }

            console.log("[BluetoothLESensor] Starting notifications...");
            await myCharacteristic?.startNotifications();

            console.log("[BluetoothLESensor] Notifications started");
        }
        catch (error)
        {
            console.error("[BluetoothLESensor] There was a problem listening to sensor for " + characteristic, error);
            throw error;
        }
    }

    async stop(): Promise<void> 
    {
        console.log("[BluetoothLESensor] Stopping active BLE session...");

        for (const char of this.activeCharacteristics) {
            try {
                if (this.valueChangedListener) {
                    char.removeEventListener('characteristicvaluechanged', this.valueChangedListener);
                }
                if (char.service.device.gatt?.connected) {
                    await char.stopNotifications();
                    console.log("[BluetoothLESensor] Successfully stopped notifications on characteristic:", char.uuid);
                }
            } catch (err) {
                console.warn("[BluetoothLESensor] Warning stopping characteristic notifications:", err);
            }
        }

        this.activeCharacteristics = [];
        this.valueChangedListener = null;

        try {
            if (this.nativeDevice?.gatt?.connected) {
                console.log("[BluetoothLESensor] Disconnecting native GATT server...");
                this.nativeDevice.gatt.disconnect();
            }
        } catch (err) {
            console.warn("[BluetoothLESensor] Warning during GATT disconnect:", err);
        }
    }
}