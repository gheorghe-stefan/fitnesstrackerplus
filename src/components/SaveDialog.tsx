import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { Save, DeleteOutline } from '@mui/icons-material';

export interface SaveDialogProps {
  open: boolean;
  trackPointCount: number;
  elapsedTime: string;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * Confirmation dialog shown after stopping a recording.
 * Offers Save (export TCX) or Discard (throw away data).
 */
export const SaveDialog: React.FC<SaveDialogProps> = ({
  open,
  trackPointCount,
  elapsedTime,
  onSave,
  onDiscard,
}) => {
  return (
    <Dialog
      open={open}
      aria-labelledby="save-dialog-title"
      aria-describedby="save-dialog-description"
      PaperProps={{ className: 'save-dialog-paper' }}
    >
      <DialogTitle id="save-dialog-title">Save Activity?</DialogTitle>
      <DialogContent>
        <DialogContentText id="save-dialog-description">
          You recorded <strong>{trackPointCount}</strong> data point{trackPointCount !== 1 ? 's' : ''} over{' '}
          <strong>{elapsedTime}</strong>. Would you like to save this activity as a TCX file?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDiscard} color="error" startIcon={<DeleteOutline />} id="btn-discard">
          Discard
        </Button>
        <Button onClick={onSave} color="primary" variant="contained" startIcon={<Save />} autoFocus id="btn-save">
          Save TCX
        </Button>
      </DialogActions>
    </Dialog>
  );
};
