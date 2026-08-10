import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  LinearProgress,
  Box,
  Typography
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
  trackPoints,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const defaultExporter = new TcxExporter();

  const handleStravaUpload = async () => {
    if (!stravaAuth || !trackPoints || trackPoints.length === 0) return;
    
    setUploading(true);
    setUploadMessage('Preparing upload...');
    setUploadComplete(false);
    setUploadError(false);
    
    try {
      const tcxContent = defaultExporter.export(trackPoints);
      // Convert string to ArrayBuffer for upload
      const encoder = new TextEncoder();
      const tcxBuffer = encoder.encode(tcxContent).buffer;
      
      setUploadMessage('Uploading activity to Strava...');
      
      const uploadResult = await StravaService.EnqueueActivityForUpload(
        stravaAuth.access_token,
        tcxBuffer,
        'Treadmill run',
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
        const status = await StravaService.CheckUploadStatus(stravaAuth.access_token, uploadResult.id_str);
        if (status) {
          if (status.error) {
            setUploadMessage(`Error from Strava: ${status.error}`);
            setUploadError(true);
            if (pollingRef.current) clearInterval(pollingRef.current);
            setUploading(false);
          } else if (status.activity_id) {
            setUploadMessage('Activity successfully uploaded to Strava!');
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
          <DialogContentText id="save-dialog-description">
            You recorded <strong>{trackPointCount}</strong> data point{trackPointCount !== 1 ? 's' : ''} over{' '}
            <strong>{elapsedTime}</strong>. Would you like to save this activity?
          </DialogContentText>
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
        {stravaAuth && (
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
