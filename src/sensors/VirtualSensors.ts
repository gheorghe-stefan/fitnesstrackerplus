import { ISensor } from "./SensorManager";

export class VirtualSensor<T> implements ISensor<T>
{
    Value: T;

    constructor(defaultValue: T)
    {
        this.Value = defaultValue;
    }

    get name(): string {
        return "Virtual HR Sensor";
    }

    onDisconnected: (() => void) | null = null;

    private notification: (data: T) => void = () => {};

    async start(notification: (data: T) => void): Promise<void> {
        this.notification = notification;
        this.notification(this.Value);
    }

    disconnect(): void {
        this.notification = () => {};
    }
    
    setValue(value: T)
    {
        this.Value = value;
        this.notification(value);
    }
}

export default abstract class VirtualSensors
{
    static HRSensor: VirtualSensor<number>;

    static {
        this.HRSensor = new VirtualSensor(70);
    }
}