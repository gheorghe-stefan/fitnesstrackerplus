import { ISensor } from "../domain/ISensor";

export class VirtualSensor<T> implements ISensor<T>
{
    Value: T;
    private sensorName: string;

    constructor(defaultValue: T, name: string = "Virtual Sensor")
    {
        this.Value = defaultValue;
        this.sensorName = name;
    }

    get name(): string {
        return this.sensorName;
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
    static HRSensor: VirtualSensor<number> = new VirtualSensor(70, "Virtual HR Sensor");
    static TreadmillSensor: VirtualSensor<import("../domain/TreadmillData").TreadmillData> = new VirtualSensor({
        speed: 8.5,
        inclination: 6.3,
        rawInclineLevel: 1,
        distance: 1250,
        calories: 85,
        heartRate: 142,
        elapsedTime: 480,
    }, "Virtual Treadmill Sensor");
}