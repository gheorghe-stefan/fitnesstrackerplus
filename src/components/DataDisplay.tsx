import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatTime } from '../services/TimeFormatter';
import { TreadmillData } from '../domain/TreadmillData';
import { PowerData } from '../domain/PowerData';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SettingsIcon from '@mui/icons-material/Settings';
import { Popover, Switch, FormControlLabel, FormGroup, IconButton } from '@mui/material';

export interface DataDisplayProps {
  heartRate: number;
  isConnected: boolean;
  elapsedSeconds: number;
  treadmillData?: TreadmillData;
  isTreadmillConnected?: boolean;
  elevationGain?: number;
  recordedDistanceMeters?: number;
  powerData?: PowerData;
  isPowerConnected?: boolean;
}

const DEFAULT_LAYOUT = ['hr', 'speed', 'incline', 'elevation', 'timer', 'distance'];
const DEFAULT_HIDDEN = ['latitude', 'longitude', 'absElevation', 'cadence', 'power'];
const ALL_WIDGETS = [...DEFAULT_LAYOUT, ...DEFAULT_HIDDEN];

const WIDGET_LABELS: Record<string, string> = {
  hr: 'Heart Rate',
  speed: 'Speed',
  incline: 'Incline Grade',
  elevation: 'Elevation Gain',
  timer: 'Duration',
  distance: 'Distance',
  latitude: 'Latitude (deg)',
  longitude: 'Longitude (deg)',
  absElevation: 'Absolute Elevation (m)',
  cadence: 'Cadence (rpm)',
  power: 'Power (W)'
};

function SortableWidget({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? '0px 10px 20px rgba(0,0,0,0.3)' : undefined,
    scale: isDragging ? '1.02' : '1',
    touchAction: 'none', // Critical for pointer sensor to work on mobile without scrolling
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export const DataDisplay: React.FC<DataDisplayProps> = ({
  heartRate,
  isConnected,
  elapsedSeconds,
  treadmillData,
  isTreadmillConnected = false,
  elevationGain = 0.0,
  recordedDistanceMeters = 0.0,
  powerData,
  isPowerConnected = false,
}) => {
  const [layout, setLayout] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('fitnesstrackerplus_dashboard_layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLayout(parsed.layout || DEFAULT_LAYOUT);
        setHidden(parsed.hidden || DEFAULT_HIDDEN);
      } catch (e) {
        setLayout(DEFAULT_LAYOUT);
        setHidden(DEFAULT_HIDDEN);
      }
    } else {
      setLayout(DEFAULT_LAYOUT);
      setHidden(DEFAULT_HIDDEN);
    }
    setIsLoaded(true);
  }, []);

  const saveLayout = (newLayout: string[], newHidden: string[]) => {
    localStorage.setItem('fitnesstrackerplus_dashboard_layout', JSON.stringify({
      layout: newLayout,
      hidden: newHidden
    }));
  };

  // Configure pointer sensor for long press drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250, // 250ms long press to start dragging
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newLayout = arrayMove(items, oldIndex, newIndex);
        saveLayout(newLayout, hidden);
        return newLayout;
      });
    }
  };

  const handleToggleWidget = (id: string, isChecked: boolean) => {
    let newLayout = [...layout];
    let newHidden = [...hidden];

    if (isChecked) {
      newHidden = newHidden.filter(w => w !== id);
      if (!newLayout.includes(id)) newLayout.push(id);
    } else {
      newLayout = newLayout.filter(w => w !== id);
      if (!newHidden.includes(id)) newHidden.push(id);
    }

    setLayout(newLayout);
    setHidden(newHidden);
    saveLayout(newLayout, newHidden);
  };

  const speedDisplay = isTreadmillConnected && treadmillData ? treadmillData.speed.toFixed(1) : '--';
  const inclineDisplay = isTreadmillConnected && treadmillData ? `${treadmillData.inclination.toFixed(1)}%` : '--';
  const inclineLevelSub = isTreadmillConnected && treadmillData ? `Level ${treadmillData.rawInclineLevel}` : '';
  const activeDistance = recordedDistanceMeters > 0 ? recordedDistanceMeters : (treadmillData?.distance || 0);
  const distanceKmDisplay = isTreadmillConnected ? (Math.floor(activeDistance) / 1000).toFixed(3) : '--';
  const elevationDisplay = elevationGain > 0 ? `+${elevationGain.toFixed(1)}` : '+0.0';

  const renderWidgetContent = (id: string) => {
    switch (id) {
      case 'hr':
        return (
          <div className="metric-card hr-card">
            <div className="metric-label">Heart Rate</div>
            <div className="metric-value-container">
              <span className={`metric-value hr-value ${isConnected && heartRate > 0 ? 'active' : ''}`}>
                {isConnected ? (heartRate > 0 ? heartRate : '--') : '--'}
              </span>
              <span className="metric-unit">bpm</span>
            </div>
          </div>
        );
      case 'speed':
        return (
          <div className="metric-card speed-card">
            <div className="metric-label">Speed</div>
            <div className="metric-value-container">
              <span className={`metric-value speed-value ${isTreadmillConnected ? 'active' : ''}`}>
                {speedDisplay}
              </span>
              <span className="metric-unit">km/h</span>
            </div>
          </div>
        );
      case 'incline':
        return (
          <div className="metric-card incline-card">
            <div className="metric-label">Incline Grade</div>
            <div className="metric-value-container">
              <span className={`metric-value incline-value ${isTreadmillConnected ? 'active' : ''}`}>
                {inclineDisplay}
              </span>
            </div>
            {inclineLevelSub && <div className="metric-sublabel">{inclineLevelSub}</div>}
          </div>
        );
      case 'elevation':
        return (
          <div className="metric-card elevation-card">
            <div className="metric-label">Elevation Gain</div>
            <div className="metric-value-container">
              <span className={`metric-value elevation-value ${elevationGain > 0 ? 'active' : ''}`}>
                {elevationDisplay}
              </span>
              <span className="metric-unit">m</span>
            </div>
          </div>
        );
      case 'timer':
        const activeDuration = elapsedSeconds > 0 ? elapsedSeconds : (treadmillData?.elapsedTime || 0);
        return (
          <div className="metric-card timer-card">
            <div className="metric-label">Duration</div>
            <div className="metric-value-container">
              <span className={`metric-value timer-value ${isTreadmillConnected ? 'active' : ''}`}>{formatTime(activeDuration)}</span>
            </div>
          </div>
        );
      case 'distance':
        return (
          <div className="metric-card distance-card">
            <div className="metric-label">Distance</div>
            <div className="metric-value-container">
              <span className={`metric-value distance-value ${isTreadmillConnected ? 'active' : ''}`}>
                {distanceKmDisplay}
              </span>
              <span className="metric-unit">km</span>
            </div>
          </div>
        );
      case 'latitude':
        return (
          <div className="metric-card">
            <div className="metric-label">Latitude</div>
            <div className="metric-value-container">
              <span className="metric-value">--</span>
              <span className="metric-unit">deg</span>
            </div>
          </div>
        );
      case 'longitude':
        return (
          <div className="metric-card">
            <div className="metric-label">Longitude</div>
            <div className="metric-value-container">
              <span className="metric-value">--</span>
              <span className="metric-unit">deg</span>
            </div>
          </div>
        );
      case 'absElevation':
        return (
          <div className="metric-card">
            <div className="metric-label">Abs Elevation</div>
            <div className="metric-value-container">
              <span className="metric-value">--</span>
              <span className="metric-unit">m</span>
            </div>
          </div>
        );
      case 'cadence':
        const cadenceDisplay = isPowerConnected && powerData && powerData.cadence !== undefined ? powerData.cadence : '--';
        return (
          <div className="metric-card">
            <div className="metric-label">Cadence</div>
            <div className="metric-value-container">
              <span className={`metric-value ${isPowerConnected ? 'active' : ''}`}>{cadenceDisplay}</span>
              <span className="metric-unit">rpm</span>
            </div>
          </div>
        );
      case 'power':
        const powerDisplay = isPowerConnected && powerData ? powerData.power : '--';
        return (
          <div className="metric-card">
            <div className="metric-label">Power</div>
            <div className="metric-value-container">
              <span className={`metric-value ${isPowerConnected ? 'active' : ''}`}>{powerDisplay}</span>
              <span className="metric-unit">W</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isLoaded) return null;

  const portalRoot = document.getElementById('header-settings-portal');
  const settingsButton = (
    <>
      <IconButton 
        onClick={(e) => setAnchorEl(e.currentTarget)} 
        size="small" 
        sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}
      >
        <SettingsIcon />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            background: 'rgba(10, 10, 15, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            maxHeight: '400px'
          }
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
          Visible Metrics
        </h4>
        <FormGroup>
          {ALL_WIDGETS.map(id => (
            <FormControlLabel
              key={id}
              control={
                <Switch 
                  checked={layout.includes(id)} 
                  onChange={(e) => handleToggleWidget(id, e.target.checked)}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00f2fe',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00f2fe',
                    },
                  }}
                />
              }
              label={<span style={{ fontSize: '0.85rem' }}>{WIDGET_LABELS[id]}</span>}
            />
          ))}
        </FormGroup>
      </Popover>
    </>
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {portalRoot ? createPortal(settingsButton, portalRoot) : settingsButton}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={layout}
          strategy={rectSortingStrategy}
        >
          <div className="data-display">
            {layout.map((id) => (
              <SortableWidget key={id} id={id}>
                {renderWidgetContent(id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
