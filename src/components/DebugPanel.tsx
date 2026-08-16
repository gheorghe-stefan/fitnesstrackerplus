import React, { useState } from 'react';
import VirtualSensors from '../sensors/VirtualSensors';
import { SensorManager } from '../sensors/SensorManager';
import './DebugPanel.css';

export const DebugPanel: React.FC = () => {
    const [hr, setHr] = useState<number>(70);
    const [speed, setSpeed] = useState<number>(0);
    const [incline, setIncline] = useState<number>(0);
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
                    
                    <div className="debug-future-section">
                        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '10px' }}>Future Mocks:</p>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button disabled style={{ fontSize: '0.65rem' }}>Cadence</button>
                            <button disabled style={{ fontSize: '0.65rem' }}>Power</button>
                            <button disabled style={{ fontSize: '0.65rem' }}>GPS</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
