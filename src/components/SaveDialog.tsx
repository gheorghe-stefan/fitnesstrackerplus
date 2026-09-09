import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  LinearProgress,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Save, DeleteOutline, CloudUpload } from '@mui/icons-material';
import { StravaAuthentication } from '../strava/StravaModels';
import { StravaService } from '../strava/StravaService';
import { TrackPoint } from '../domain/models';
import { TcxExporter } from '../services/TcxExporter';

export interface SaveDialogProps {
  open: boolean;
  trackPointCount: number;
  elapsedTime: string;
  onSave: () => void;
  onDiscard: () => void;
  stravaAuth?: StravaAuthentication | null;
  stravaAccounts?: StravaAuthentication[];
  trackPoints?: readonly TrackPoint[];
}

/**
 * Confirmation dialog shown after stopping a recording.
 * Offers Save (export TCX), Strava Upload, or Discard.
 */
export const SaveDialog: React.FC<SaveDialogProps> = ({
  open,
  trackPointCount,
  elapsedTime,
  onSave,
  onDiscard,
  stravaAuth,
  stravaAccounts = [],
  trackPoints,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<React.ReactNode>('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Sync selected athlete with active stravaAuth
  useEffect(() => {
    if (stravaAuth) {
      setSelectedAthleteId(stravaAuth.athlete.id);
    } else if (stravaAccounts.length > 0) {
      setSelectedAthleteId(stravaAccounts[0].athlete.id);
    }
  }, [stravaAuth, stravaAccounts, open]);

  const defaultExporter = new TcxExporter();

  const handleStravaUpload = async () => {
    const targetAccount = stravaAccounts.find(a => a.athlete.id === selectedAthleteId) ?? stravaAuth;
    if (!targetAccount || !trackPoints || trackPoints.length === 0) return;
    
    setUploading(true);
    setUploadMessage('Preparing upload...');
    setUploadComplete(false);
    setUploadError(false);
    
    try {
      let activeToken = targetAccount.access_token;
      if (targetAccount.isTokenExpired()) {
        setUploadMessage('Refreshing Strava access token...');
        const refreshed = await StravaService.RefreshAccessToken(targetAccount.refresh_token, targetAccount.athlete);
        if (refreshed) {
          activeToken = refreshed.access_token;
        }
      }

      const tcxContent = defaultExporter.export(trackPoints);
      const encoder = new TextEncoder();
      const tcxBuffer = encoder.encode(tcxContent).buffer;
      
      const athleteName = `${targetAccount.athlete.firstname} ${targetAccount.athlete.lastname}`.trim();
      setUploadMessage(`Uploading activity to Strava for ${athleteName}...`);
      
      const uploadResult = await StravaService.EnqueueActivityForUpload(
        activeToken,
        tcxBuffer,
        'Workout',
        'Powered by FitnessTracker+',
        'tcx'
      );
      
      if (!uploadResult || !uploadResult.id_str) {
        setUploadMessage('Upload failed. Please check console.');
        setUploadError(true);
        setUploading(false);
        return;
      }
      
      setUploadMessage('Processing activity on Strava...');
      
      pollingRef.current = setInterval(async () => {
        const status = await StravaService.CheckUploadStatus(activeToken, uploadResult.id_str);
        if (status) {
          if (status.error) {
            setUploadMessage(`Error from Strava: ${status.error}`);
            setUploadError(true);
            if (pollingRef.current) clearInterval(pollingRef.current);
            setUploading(false);
          } else if (status.activity_id) {
            setUploadMessage(
              <span>
                Activity successfully uploaded to Strava!{' '}
                <a 
                  href={`https://www.strava.com/activities/${status.activity_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#aed581', fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  View Activity
                </a>
              </span>
            );
            setUploadComplete(true);
            if (pollingRef.current) clearInterval(pollingRef.current);
            setUploading(false);
          } else {
            setUploadMessage(`Processing... Status: ${status.status}`);
          }
        }
      }, 1000);
      
    } catch (err) {
      console.error(err);
      setUploadMessage('An error occurred during upload.');
      setUploadError(true);
      setUploading(false);
    }
  };

  const cleanupAndClose = (callback: () => void) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setUploading(false);
    setUploadMessage('');
    setUploadComplete(false);
    setUploadError(false);
    callback();
  };

  const hasStrava = Boolean(stravaAuth || stravaAccounts.length > 0);

  return (
    <Dialog
      open={open}
      aria-labelledby="save-dialog-title"
      aria-describedby="save-dialog-description"
      PaperProps={{ className: 'save-dialog-paper' }}
    >
      <DialogTitle id="save-dialog-title">Save Activity?</DialogTitle>
      <DialogContent>
        {!uploading && !uploadComplete && !uploadError ? (
          <>
            <DialogContentText id="save-dialog-description">
              You recorded <strong>{trackPointCount}</strong> data point{trackPointCount !== 1 ? 's' : ''} over{' '}
              <strong>{elapsedTime}</strong>. Would you like to save this activity?
            </DialogContentText>
            {stravaAccounts.length > 1 && (
              <Box sx={{ mt: 2, mb: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="strava-account-select-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>Upload as Strava User</InputLabel>
                  <Select
                    labelId="strava-account-select-label"
                    value={selectedAthleteId ?? ''}
                    label="Upload as Strava User"
                    onChange={(e) => setSelectedAthleteId(Number(e.target.value))}
                    sx={{
                      color: '#fff',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FC4C02' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FC4C02' },
                    }}
                  >
                    {stravaAccounts.map((a) => (
                      <MenuItem key={a.athlete.id} value={a.athlete.id}>
                        {a.athlete.firstname} {a.athlete.lastname}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ mt: 2 }}>
             <Typography variant="body1" gutterBottom>{uploadMessage}</Typography>
             {uploading && <LinearProgress color="primary" />}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => cleanupAndClose(onDiscard)} color="error" startIcon={<DeleteOutline />} id="btn-discard" disabled={uploading}>
          Discard
        </Button>
        <Button onClick={() => cleanupAndClose(onSave)} color="primary" variant="outlined" startIcon={<Save />} id="btn-save" disabled={uploading}>
          Save TCX
        </Button>
        {hasStrava && (
          <Button 
            onClick={handleStravaUpload} 
            color="secondary" 
            variant="contained" 
            startIcon={<CloudUpload />}
            disabled={uploading || uploadComplete || trackPointCount === 0}
            sx={{ bgcolor: '#fc5200', '&:hover': { bgcolor: '#e34a00' }, color: 'white' }}
          >
            Upload to Strava
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
