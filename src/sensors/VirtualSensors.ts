import { ISensor } from "../domain/ISensor";
import { TreadmillData } from "../domain/TreadmillData";
import { PowerData } from "../domain/PowerData";

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
    
    static PowerSensor: VirtualSensor<PowerData> = new VirtualSensor<PowerData>({ power: 0, cadence: 0 }, "Virtual Power Sensor");
    static TargetPower: number = 200;
    static TargetCadence: number = 90;

    static TreadmillSensor: VirtualSensor<TreadmillData> = new VirtualSensor({
        speed: 0,
        inclination: 0,
        rawInclineLevel: 0,
        distance: 0,
        calories: 0,
        heartRate: 70,
        elapsedTime: 0,
    }, "Virtual Treadmill Sensor");

    private static timer: NodeJS.Timeout | null = null;
    private static lastTick: number = 0;

    static startSimulation() {
        if (this.timer) return;
        this.lastTick = Date.now();
        this.timer = setInterval(() => {
            const now = Date.now();
            const deltaSeconds = (now - this.lastTick) / 1000;
            this.lastTick = now;

            const current = this.TreadmillSensor.Value;
            
            // Only accumulate if speed > 0
            if (current.speed > 0) {
                const distanceIncrement = (current.speed * 1000 / 3600) * deltaSeconds;
                const caloriesIncrement = (current.speed * (deltaSeconds / 3600)) * 75; // Mock assuming 75kg

                const newData: TreadmillData = {
                    ...current,
                    distance: current.distance + distanceIncrement,
                    elapsedTime: current.elapsedTime + deltaSeconds,
                    calories: current.calories + caloriesIncrement
                };
                
                
                this.TreadmillSensor.setValue(newData);
            }

            // Simulate Power/Cadence streaming if PowerSensor is active
            const currentPower = this.PowerSensor.Value;
            if (currentPower) { 
                this.PowerSensor.setValue({ power: this.TargetPower, cadence: this.TargetCadence });
            }
        }, 1000);
    }
}

// Auto-start simulation when imported
VirtualSensors.startSimulation();