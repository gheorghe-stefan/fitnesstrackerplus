import { ISensor } from "../../domain/ISensor";
import { PowerData } from "../../domain/PowerData";
import { BluetoothSensorBase } from "./BluetoothSensors";
import { parseCyclingPowerData } from "./CyclingPowerDataParser";
import { IBluetoothLESensor } from "./BluetoothLESensor";

export class PowerBluetoothSensor extends BluetoothSensorBase implements ISensor<PowerData> {
    private prevCrankRevs = -1;
    private prevCrankTime = -1;
    private lastCadence = 0;



    async start(notification: (data: PowerData) => void): Promise<void> {
        await this.bluetoothLESensor.start("cycling_power_measurement", dataView => {
            const rawData = parseCyclingPowerData(dataView);
            let cadence = this.lastCadence;

            if (rawData.crankRevolutions !== undefined && rawData.lastCrankEventTime !== undefined) {
                if (this.prevCrankRevs !== -1 && this.prevCrankTime !== -1) {
                    let dRevs = rawData.crankRevolutions - this.prevCrankRevs;
                    if (dRevs < 0) dRevs += 65536;

                    let dTime = rawData.lastCrankEventTime - this.prevCrankTime;
                    if (dTime < 0) dTime += 65536;

                    if (dTime > 0) {
                        cadence = Math.round((dRevs * 1024 * 60) / dTime);
                        this.lastCadence = cadence;
                    }
                    
                    if (dRevs === 0 && dTime > 2048) {
                        cadence = 0;
                        this.lastCadence = 0;
                    }
                }

                this.prevCrankRevs = rawData.crankRevolutions;
                this.prevCrankTime = rawData.lastCrankEventTime;
            }

            notification({
                power: rawData.power,
                cadence: cadence
            });
        });
    }
}
