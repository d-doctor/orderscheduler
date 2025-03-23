import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import useGetCalendarList from '../../hooks/useGetCalendarList';
import { GoogCal } from '../../interfaces/GoogleModels';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../service/firebase';
import { useRecoilState } from 'recoil';
import { routingsMapState } from '../../atoms/settings';

interface Props {
  open: boolean;
  onClose: () => void;
}

function SettingsAddEditRoutingModal({ open, onClose }: Props) {
  const { getCalendarList, getCalendarListResponse } = useGetCalendarList();
  const [calendarList, setCalendarList] = useState<GoogCal[]>();
  const [selectedCalendarId, setSelectedCalendarId] =
    useState<string>('pickacalender');
  const [selectedCalendarName, setSelectedCalendarName] = useState<string>('');
  const [selectedRouting, setSelectedRouting] = useState<string>('');
  const [, setRoutingsMap] = useRecoilState(routingsMapState);

  useEffect(() => {
    if (getCalendarListResponse) {
      setCalendarList(getCalendarListResponse.items);
    }
  }, [getCalendarListResponse]);

  useEffect(() => {
    if (open && getCalendarList) {
      getCalendarList();
    }
  }, [getCalendarList, open]);

  const saveAndClose = useCallback(() => {
    const saveRouting = async () => {
      try {
        await setDoc(
          doc(db, 'routingMap', selectedRouting.toLocaleUpperCase()),
          {
            routingCode: selectedRouting,
            calendarID: selectedCalendarId,
            calendarName: selectedCalendarName,
            locked: false,
          }
        ).then(() => {
          setRoutingsMap((oldList) => [
            ...oldList,
            {
              routingCode: selectedRouting,
              calendarID: selectedCalendarId,
              calendarName: selectedCalendarName,
              locked: false,
            },
          ]);
        });
      } catch (e) {
        console.log('failed to save routing map ', e);
      } finally {
        onClose();
      }
    };
    saveRouting();
  }, [
    onClose,
    selectedCalendarId,
    selectedCalendarName,
    selectedRouting,
    setRoutingsMap,
  ]);

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Add Routing to Calendar mapping</DialogTitle>
        <DialogContent dividers>
          <FormControl style={{ minWidth: 90, maxWidth: 90, paddingRight: 3 }}>
            <TextField
              size="small"
              required
              label="Routing Code"
              value={selectedRouting}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setSelectedRouting(event.target.value);
              }}
            ></TextField>
          </FormControl>
          <FormControl style={{ minWidth: 200, maxWidth: 250 }}>
            <InputLabel>Calendar</InputLabel>
            <Select
              value={selectedCalendarId}
              size="small"
              label="Pick Calendar"
              onChange={(event: SelectChangeEvent) => {
                let pickedCal = calendarList?.find(
                  (cal) => cal.id === event.target.value
                );
                setSelectedCalendarId(event.target.value);
                setSelectedCalendarName(pickedCal?.summary || '');
              }}
            >
              <MenuItem key="nocal" value="pickacalendar">
                Select A Calendar
              </MenuItem>
              {calendarList?.map((calendar) => (
                <MenuItem key={calendar?.id} value={calendar?.id}>
                  {calendar.summary}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveAndClose()}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SettingsAddEditRoutingModal;
