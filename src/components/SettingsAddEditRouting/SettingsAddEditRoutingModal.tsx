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
import { FirebaseRoutingSetting } from '../../interfaces/FirebaseModels';

interface Props {
  open: boolean;
  onClose: () => void;
  editRouting?: FirebaseRoutingSetting;
}

function SettingsAddEditRoutingModal({ open, onClose, editRouting }: Props) {
  const { getCalendarList, getCalendarListResponse } = useGetCalendarList();
  const [calendarList, setCalendarList] = useState<GoogCal[]>();
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(
    editRouting?.calendarID || 'pickacalender'
  );
  const [selectedCalendarName, setSelectedCalendarName] = useState<string>(
    editRouting?.calendarName || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    editRouting?.category || ''
  );
  const [selectedRouting, setSelectedRouting] = useState<string>(
    editRouting?.routingCode || ''
  );
  const [routingsMap, setRoutingsMap] = useRecoilState(routingsMapState);

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
            category: selectedCategory,
          }
        ).then(() => {
          if (!editRouting) {
            setRoutingsMap((oldList) => [
              ...oldList,
              {
                routingCode: selectedRouting,
                calendarID: selectedCalendarId,
                calendarName: selectedCalendarName,
                locked: false,
                category: selectedCategory,
              },
            ]);
          } else {
            // let newList = routingsMap;
            const itemIndex = routingsMap.findIndex((item) => {
              return item.routingCode === selectedRouting;
            });
            const newList = [
              ...routingsMap.slice(0, itemIndex),
              {
                routingCode: selectedRouting,
                calendarID: selectedCalendarId,
                calendarName: selectedCalendarName,
                locked: false,
                category: selectedCategory,
              } satisfies FirebaseRoutingSetting,

              ...routingsMap.slice(itemIndex + 1),
            ];
            setRoutingsMap(newList);
          }
        });
      } catch (e) {
        console.log('failed to save routing map ', e);
      } finally {
        onClose();
      }
    };
    saveRouting();
  }, [
    editRouting,
    onClose,
    routingsMap,
    selectedCalendarId,
    selectedCalendarName,
    selectedCategory,
    selectedRouting,
    setRoutingsMap,
  ]);

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Add Routing to Calendar mapping</DialogTitle>
        <DialogContent dividers>
          <FormControl style={{ minWidth: 200, maxWidth: 250 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              size="small"
              label="Category"
              onChange={(event: SelectChangeEvent) => {
                setSelectedCategory(event?.target.value);
              }}
            >
              <MenuItem key="none" value="uncategorized">
                Uncategorized
              </MenuItem>
              <MenuItem key="Production" value="Production">
                Production
              </MenuItem>
              <MenuItem key="Install" value="Install">
                Install
              </MenuItem>
            </Select>
          </FormControl>
          <FormControl style={{ minWidth: 90, maxWidth: 90, paddingRight: 3 }}>
            <TextField
              size="small"
              required
              label="Routing Code"
              disabled={!!editRouting}
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
