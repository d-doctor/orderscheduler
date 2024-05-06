import React, { useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { addDoc, collection, doc } from 'firebase/firestore';
import { db, firebaseAuth } from '../../service/firebase';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  jobNumber: string;
  onClose: () => void;
}

function NoteModal({ open, jobNumber, onClose }: Props) {
  const [note, setNote] = React.useState<string>('');

  const handleSaveNote = useCallback(async () => {
    try {
      const job = doc(db, 'jobs', jobNumber);
      const notesCollection = collection(job, 'notes');
      await addDoc(notesCollection, {
        text: note,
        addedDate: dayjs().toISOString(),
        addedBy: firebaseAuth.currentUser?.displayName,
        status: '',
      });
    } catch (e) {
      console.log('failed to save note', e);
    }
    setNote('');
    onClose();
  }, [jobNumber, note, onClose]);

  return (
    <Dialog open={open} maxWidth={'xl'} fullWidth={true}>
      <DialogTitle>Enter a Note</DialogTitle>
      <DialogContent dividers>
        <TextField
          id="note"
          required
          size="small"
          fullWidth
          label="Note Text"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
          }}
        ></TextField>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSaveNote}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default NoteModal;
