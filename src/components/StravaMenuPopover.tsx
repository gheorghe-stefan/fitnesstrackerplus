import React, { useState } from 'react';
import { Popover, IconButton, Tooltip, Radio } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { StravaAuthentication } from '../strava/StravaModels';

export interface StravaMenuPopoverProps {
  accounts: StravaAuthentication[];
  activeAthleteId: number | null;
  onSelectAccount: (athleteId: number) => void;
  onRemoveAccount: (athleteId: number) => void;
  onConnectNew: () => void;
  onDisconnectAll: () => void;
}

export const StravaMenuPopover: React.FC<StravaMenuPopoverProps> = ({
  accounts,
  activeAthleteId,
  onSelectAccount,
  onRemoveAccount,
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

  if (accounts.length === 0) {
    return null;
  }

  const activeAccount = accounts.find((a) => a.athlete.id === activeAthleteId) ?? accounts[0];
  const activeName = `${activeAccount.athlete.firstname} ${activeAccount.athlete.lastname}`.trim() || 'Strava User';

  const open = Boolean(anchorEl);
  const id = open ? 'strava-account-popover' : undefined;

  return (
    <>
      <button
        className="sensor-name-pill strava-user-pill"
        onClick={handleOpen}
        aria-describedby={id}
        title="Manage Strava accounts"
      >
        {activeAccount.athlete.profile && (
          <img
            src={activeAccount.athlete.profile}
            alt={activeName}
            className="strava-pill-avatar"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}
        <span className="sensor-pill-text">{activeName}</span>
        {accounts.length > 1 && (
          <span className="sensor-pill-badge" style={{ backgroundColor: '#FC4C02' }}>
            {accounts.length}
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
            minWidth: '320px',
            maxWidth: '390px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
          },
        }}
      >
        <div className="sensor-popover-container">
          <div className="sensor-popover-header">
            <span className="sensor-popover-title" style={{ color: '#FC4C02' }}>
              Strava Accounts
            </span>
            <span className="sensor-popover-count">
              {accounts.length} linked
            </span>
          </div>

          <div className="sensor-popover-list">
            {accounts.map((auth) => {
              const athlete = auth.athlete;
              const isSelected = athlete.id === activeAthleteId;
              const name = `${athlete.firstname} ${athlete.lastname}`.trim() || 'Strava Athlete';

              return (
                <div
                  key={athlete.id}
                  className={`sensor-device-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    if (!isSelected) {
                      onSelectAccount(athlete.id);
                    }
                  }}
                >
                  <Radio
                    checked={isSelected}
                    size="small"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      padding: '4px',
                      '&.Mui-checked': {
                        color: '#FC4C02',
                      },
                    }}
                  />
                  {athlete.profile && (
                    <img
                      src={athlete.profile}
                      alt={name}
                      className="strava-account-avatar"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="sensor-device-info">
                    <div className="sensor-device-name" title={name}>
                      {name}
                    </div>
                    {athlete.city && (
                      <div className="sensor-device-val">{athlete.city}{athlete.country ? `, ${athlete.country}` : ''}</div>
                    )}
                  </div>
                  <div className="sensor-device-status">
                    {isSelected && (
                      <span className="active-tag" style={{ color: '#FC4C02', borderColor: '#FC4C02' }}>
                        Active
                      </span>
                    )}
                    <Tooltip title={`Remove ${name}`}>
                      <IconButton
                        size="small"
                        className="sensor-disconnect-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveAccount(athlete.id);
                          if (accounts.length <= 1) {
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
              );
            })}
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
              <span>Connect Another Account</span>
            </button>
            <button
              className="sensor-action-btn disconnect-all-btn"
              onClick={() => {
                handleClose();
                onDisconnectAll();
              }}
            >
              <PowerSettingsNewIcon fontSize="small" />
              <span>Log Out All</span>
            </button>
          </div>
        </div>
      </Popover>
    </>
  );
};
