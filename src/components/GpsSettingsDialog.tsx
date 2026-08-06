import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { VirtualGpsConfig } from '../domain/VirtualGpsModels';
import { AvailablePathGenerators } from '../services/VirtualPathGenerators';

export interface GpsSettingsDialogProps {
  open: boolean;
  config: VirtualGpsConfig;
  onSave: (newConfig: Partial<VirtualGpsConfig>) => void;
  onClose: () => void;
}

export const GpsSettingsDialog: React.FC<GpsSettingsDialogProps> = ({
  open,
  config,
  onSave,
  onClose,
}) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [startLat, setStartLat] = useState(config.startLat.toString());
  const [startLon, setStartLon] = useState(config.startLon.toString());
  const [startEle, setStartEle] = useState(config.startEle.toString());
  const [pathGeneratorId, setPathGeneratorId] = useState(config.pathGeneratorId);

  useEffect(() => {
    setEnabled(config.enabled);
    setStartLat(config.startLat.toString());
    setStartLon(config.startLon.toString());
    setStartEle(config.startEle.toString());
    setPathGeneratorId(config.pathGeneratorId);
  }, [config, open]);

  const handleSave = () => {
    onSave({
      enabled,
      startLat: parseFloat(startLat) || 47.386254,
      startLon: parseFloat(startLon) || 9.518632,
      startEle: parseFloat(startEle) || 755.0,
      pathGeneratorId,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ className: 'save-dialog-paper' }}>
      <DialogTitle>Strava Virtual GPS & Elevation Settings</DialogTitle>
      <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.75rem' }}>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              color="primary"
            />
          }
          label="Generate Synthetic GPS Track (for Strava map & elevation)"
        />

        <TextField
          label="Start Latitude"
          type="number"
          value={startLat}
          onChange={(e) => setStartLat(e.target.value)}
          inputProps={{ step: '0.000001' }}
          disabled={!enabled}
          fullWidth
        />

        <TextField
          label="Start Longitude"
          type="number"
          value={startLon}
          onChange={(e) => setStartLon(e.target.value)}
          inputProps={{ step: '0.000001' }}
          disabled={!enabled}
          fullWidth
        />

        <TextField
          label="Start Base Elevation (meters)"
          type="number"
          value={startEle}
          onChange={(e) => setStartEle(e.target.value)}
          inputProps={{ step: '0.1' }}
          disabled={!enabled}
          fullWidth
        />

        <FormControl fullWidth disabled={!enabled}>
          <InputLabel id="path-generator-label">Path Pattern Strategy</InputLabel>
          <Select
            labelId="path-generator-label"
            value={pathGeneratorId}
            label="Path Pattern Strategy"
            onChange={(e) => setPathGeneratorId(e.target.value)}
          >
            {Object.values(AvailablePathGenerators).map((gen) => (
              <MenuItem key={gen.id} value={gen.id}>
                {gen.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions style={{ padding: '1rem 1.5rem' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};
