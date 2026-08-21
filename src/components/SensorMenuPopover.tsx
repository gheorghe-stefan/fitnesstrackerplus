import React, { useState } from 'react';
import { Popover, IconButton, Tooltip, Radio } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

export interface SensorDeviceInfo {
  id: string;
  name: string;
  displayValue?: string;
  isActive: boolean;
}

export interface SensorMenuPopoverProps {
  categoryTitle: string;
  activeColor?: string;
  devices: SensorDeviceInfo[];
  activeDeviceName: string | null;
  onSelectActive: (id: string) => void;
  onDisconnectDevice: (id: string) => void;
  onConnectNew: () => void;
  onDisconnectAll: () => void;
}

export const SensorMenuPopover: React.FC<SensorMenuPopoverProps> = ({
  categoryTitle,
  activeColor = '#ff4d6d',
  devices,
  activeDeviceName,
  onSelectActive,
  onDisconnectDevice,
  onConnectNew,
  onDisconnectAll,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!activeDeviceName && devices.length === 0) {
    return null;
  }

  const open = Boolean(anchorEl);
  const id = open ? `sensor-popover-${categoryTitle.replace(/\s+/g, '-').toLowerCase()}` : undefined;

  return (
    <>
      <button
        className="sensor-name-pill"
        onClick={handleOpen}
        aria-describedby={id}
        title="Manage connected sensors"
      >
        <span className="sensor-pill-text">{activeDeviceName || 'Connected'}</span>
        {devices.length > 1 && (
          <span className="sensor-pill-badge" style={{ backgroundColor: activeColor }}>
            {devices.length}
          </span>
        )}
        <KeyboardArrowDownIcon className="sensor-pill-chevron" fontSize="small" />
      </button>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          className: 'sensor-popover-paper',
          sx: {
            background: 'rgba(15, 18, 30, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            color: '#fff',
            minWidth: '310px',
            maxWidth: '380px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
          },
        }}
      >
        <div className="sensor-popover-container">
          <div className="sensor-popover-header">
            <span className="sensor-popover-title">{categoryTitle}</span>
            <span className="sensor-popover-count">
              {devices.length} connected
            </span>
          </div>

          <div className="sensor-popover-list">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`sensor-device-item ${device.isActive ? 'active' : ''}`}
                onClick={() => {
                  if (!device.isActive) {
                    onSelectActive(device.id);
                  }
                }}
              >
                <Radio
                  checked={device.isActive}
                  size="small"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    padding: '4px',
                    '&.Mui-checked': {
                      color: activeColor,
                    },
                  }}
                />
                <div className="sensor-device-info">
                  <div className="sensor-device-name" title={device.name}>
                    {device.name}
                  </div>
                  {device.displayValue && (
                    <div className="sensor-device-val">{device.displayValue}</div>
                  )}
                </div>
                <div className="sensor-device-status">
                  {device.isActive && (
                    <span className="active-tag" style={{ color: activeColor, borderColor: activeColor }}>
                      Active
                    </span>
                  )}
                  <Tooltip title={`Disconnect ${device.name}`}>
                    <IconButton
                      size="small"
                      className="sensor-disconnect-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDisconnectDevice(device.id);
                        if (devices.length <= 1) {
                          handleClose();
                        }
                      }}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        '&:hover': { color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.15)' },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>

          <div className="sensor-popover-actions">
            <button
              className="sensor-action-btn add-btn"
              onClick={() => {
                handleClose();
                onConnectNew();
              }}
            >
              <AddIcon fontSize="small" />
              <span>Pair Another Sensor</span>
            </button>
            <button
              className="sensor-action-btn disconnect-all-btn"
              onClick={() => {
                handleClose();
                onDisconnectAll();
              }}
            >
              <PowerSettingsNewIcon fontSize="small" />
              <span>Disconnect All</span>
            </button>
          </div>
        </div>
      </Popover>
    </>
  );
};
