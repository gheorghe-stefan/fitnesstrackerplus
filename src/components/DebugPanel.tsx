import React, { useState } from 'react';
import VirtualSensors from '../sensors/VirtualSensors';
import { SensorManager } from '../sensors/SensorManager';
import './DebugPanel.css';

export const DebugPanel: React.FC = () => {
    const [hr, setHr] = useState<number>(70);
    const [speed, setSpeed] = useState<number>(0);
    const [incline, setIncline] = useState<number>(0);
    const [power, setPower] = useState<number>(200);
    const [cadence, setCadence] = useState<number>(90);
    const [lat, setLat] = useState<number>(0);
    const [lng, setLng] = useState<number>(0);
    const [alt, setAlt] = useState<number>(0);
    const [isOpen, setIsOpen] = useState<boolean>(true);

    if (!SensorManager.UseVirtualSensors) {
        return null;
    }

    const handleHrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setHr(val);
        VirtualSensors.HRSensor.setValue(val);
        
        // Also update HR in treadmill if it's connected (since treadmill provides HR fallback)
        const currentTreadmill = VirtualSensors.TreadmillSensor.Value;
        VirtualSensors.TreadmillSensor.setValue({
            ...currentTreadmill,
            heartRate: val
        });
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setSpeed(val);
        const currentTreadmill = VirtualSensors.TreadmillSensor.Value;
        VirtualSensors.TreadmillSensor.setValue({
            ...currentTreadmill,
            speed: val
        });
    };

    const handleInclineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setIncline(val);
        const currentTreadmill = VirtualSensors.TreadmillSensor.Value;
        VirtualSensors.TreadmillSensor.setValue({
            ...currentTreadmill,
            inclination: val
        });
    };

    const handlePowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setPower(val);
        VirtualSensors.TargetPower = val;
        VirtualSensors.PowerSensor.setValue({ power: val, cadence: VirtualSensors.TargetCadence });
    };

    const handleCadenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setCadence(val);
        VirtualSensors.TargetCadence = val;
        VirtualSensors.PowerSensor.setValue({ power: VirtualSensors.TargetPower, cadence: val });
    };

    const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setLat(val);
        VirtualSensors.TargetLatitude = val;
        VirtualSensors.LocationSensor.setValue({ latitude: val, longitude: VirtualSensors.TargetLongitude, altitude: VirtualSensors.TargetAltitude });
    };

    const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setLng(val);
        VirtualSensors.TargetLongitude = val;
        VirtualSensors.LocationSensor.setValue({ latitude: VirtualSensors.TargetLatitude, longitude: val, altitude: VirtualSensors.TargetAltitude });
    };

    const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setAlt(val);
        VirtualSensors.TargetAltitude = val;
        VirtualSensors.LocationSensor.setValue({ latitude: VirtualSensors.TargetLatitude, longitude: VirtualSensors.TargetLongitude, altitude: val });
    };

    return (
        <div className={`debug-panel ${isOpen ? 'open' : 'closed'}`}>
            <div className="debug-header" onClick={() => setIsOpen(!isOpen)}>
                <span>🛠 Mock Sensors {isOpen ? '▼' : '▲'}</span>
            </div>
            {isOpen && (
                <div className="debug-content">
                    <div className="debug-row">
                        <label>Heart Rate (BPM): {hr}</label>
                        <input type="range" min="40" max="200" value={hr} onChange={handleHrChange} />
                    </div>
                    <div className="debug-row">
                        <label>Speed (km/h): {speed.toFixed(1)}</label>
                        <input type="range" min="0" max="25" step="0.1" value={speed} onChange={handleSpeedChange} />
                    </div>
                    <div className="debug-row">
                        <label>Incline (%): {incline.toFixed(1)}</label>
                        <input type="range" min="0" max="15" step="0.5" value={incline} onChange={handleInclineChange} />
                    </div>
                    <div className="debug-row">
                        <label>Power (W): {power}</label>
                        <input type="range" min="0" max="1000" step="5" value={power} onChange={handlePowerChange} />
                    </div>
                    <div className="debug-row">
                        <label>Cadence (RPM): {cadence}</label>
                        <input type="range" min="0" max="200" value={cadence} onChange={handleCadenceChange} />
                    </div>
                    <div className="debug-row">
                        <label>Latitude: {lat.toFixed(4)}</label>
                        <input type="range" min="-90" max="90" step="0.0001" value={lat} onChange={handleLatChange} />
                    </div>
                    <div className="debug-row">
                        <label>Longitude: {lng.toFixed(4)}</label>
                        <input type="range" min="-180" max="180" step="0.0001" value={lng} onChange={handleLngChange} />
                    </div>
                    <div className="debug-row">
                        <label>Altitude (m): {alt.toFixed(1)}</label>
                        <input type="range" min="-100" max="10000" step="0.5" value={alt} onChange={handleAltChange} />
                    </div>
                </div>
            )}
        </div>
    );
};
