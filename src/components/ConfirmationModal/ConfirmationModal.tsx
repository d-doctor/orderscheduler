import React from 'react';
import { WarningAmber } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { amber } from '@mui/material/colors';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmationModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <WarningAmber
          fontSize="large"
          sx={{ color: amber[500] }}
        ></WarningAmber>
        <Typography variant="subtitle1">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmationModal;
