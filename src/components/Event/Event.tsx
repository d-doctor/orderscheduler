import React, { useCallback, useEffect, useState } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useRecoilValue } from 'recoil';
import { credentialState } from '../../atoms/auth';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WarningIcon from '@mui/icons-material/Warning';
import VerifiedIcon from '@mui/icons-material/Verified';
import RefreshIcon from '@mui/icons-material/Refresh';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Routing } from '../../interfaces/VendorModels';
import { FirebaseEvent } from '../../interfaces/FirebaseModels';
import { GoogCal, GoogCalEvent } from '../../interfaces/GoogleModels';
import { setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { amber, blue, green, red } from '@mui/material/colors';
import { db } from '../../service/firebase';
import useGetCalendarEvent from '../../hooks/useGetCalendarEvent';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';

interface Props {
  routings?: Routing[];
  firebaseEvent: FirebaseEvent;
  index: number;
  calendars?: GoogCal[];
  descriptionPrefix?: string;
  address?: string;
  jobNumber: string;
  // eventAdded: (alert: string) => void;
  setEventEditMode: (index: number, editModeEnabled: boolean) => void;
  addEvent: (first: boolean, fbEvent: FirebaseEvent) => void;
}

function Event({
  routings,
  firebaseEvent,
  index,
  calendars,
  descriptionPrefix,
  address,
  jobNumber,
  // eventAdded,
  setEventEditMode,
  addEvent,
}: Props) {
  const credential = useRecoilValue(credentialState);
  const [duration, setDuration] = useState<string>(
    firebaseEvent?.duration
      ? firebaseEvent.duration.length > 0
        ? firebaseEvent.duration
        : '1'
      : '1'
  );
  const [selectedRouting, setSelectedRouting] = useState<string>(
    firebaseEvent?.routing || ''
  );
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertText, setAlertText] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dateValue, setDateValue] = useState<Dayjs>(
    dayjs(firebaseEvent?.updatedDueDate) || dayjs()
  );
  const [eventId, setEventId] = useState<string>(firebaseEvent?.eventId);
  const [calendarId, setCalendarId] = useState<string>(
    firebaseEvent?.calendar || ''
  );
  const [description, setDescription] = React.useState<string>(
    firebaseEvent?.description || ''
  );
  const [title, setTitle] = React.useState<string>(firebaseEvent?.title || '');
  const [foundOnGoogle, setFoundOnGoogle] = React.useState<boolean>();
  const [selectedCalendar, setSelectedCalendar] = React.useState<string>(
    firebaseEvent?.calendar || 'pickacalender'
  );
  const [checkboxState, setCheckboxState] = React.useState({
    routingBox: true,
  });
  const [deleted, setDeleted] = useState<boolean>(false);
  const [googleCalendarEvent, setGoogleCalendarEvent] =
    useState<GoogCalEvent>();
  const [unsavedChanges, setUnsavedChange] = useState<boolean>(false);
  const [saveInProgress, setSaveInProgress] = useState<boolean>(false);

  const {
    getCalendarEvent,
    getCalendarEventResponse,
    getCalendarEventError,
    getCalendarEventLoading,
  } = useGetCalendarEvent();

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckboxState({
      ...checkboxState,
      [event.target.name]: event.target.checked,
    });
  };

  const { routingBox } = checkboxState;
  const buildEvent = () => {
    const startDate = dateValue || dayjs();
    const endDate = startDate.add(parseInt(duration), 'hour');
    const timeZone = 'America/Chicago';
    // const summary = descriptionPrefix || "" + routingBox ? selectedRouting : "";
    let summary = descriptionPrefix || '';
    if (routingBox) {
      summary += ' ' + selectedRouting;
    }
    summary += title ? ' ' + title : '';
    const where = address;
    const event = {
      summary: summary,
      description: description || '',
      location: where || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone,
      },
    };
    return event;
  };

  const sendEventToFirebase = async (eventId: string, htmlLink: string) => {
    try {
      console.log('send to firebase function with :  ', eventId?.toString());
      await setDoc(doc(db, 'jobs', jobNumber, 'events', firebaseEvent.id), {
        calendar: selectedCalendar,
        eventId: eventId,
        htmlLink: htmlLink,
        routing: selectedRouting,
        description: description,
        title: title,
        duration: duration,
        updatedDueDate: dateValue?.toISOString() || '',
        addedDate: firebaseEvent.addedDate,
      }).then(() => {
        setAlertText('Successfully Saved');
        setAlertOpen(true);
      });
    } catch (e) {
      console.log('failed sending to firebase', e);
      setAlertText('Failed to save to database');
      setAlertOpen(true);
    }
  };

  const insertCalendarEvent = async () => {
    const insertEventURL =
      'https://www.googleapis.com/calendar/v3/calendars/' +
      selectedCalendar +
      '/events';

    const event = buildEvent();
    const postOpts = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + credential?.accessToken,
      },
      body: JSON.stringify(event),
    };
    var htmlLink: string = '';
    var eventId: string = '';
    await fetch(insertEventURL, postOpts)
      .then((response) => response.json())
      .then((json) => {
        console.log('INSERT RESULT: ', json);
        htmlLink = json.htmlLink;
        eventId = json.id;
        setEventId(eventId);
        console.log('setcalendar id', selectedCalendar);
        setCalendarId(selectedCalendar);
      })
      .catch((e) => {
        // eventAdded("Failed to save to google calendar");
        setAlertText('Failed to save to google calendar');
        setAlertOpen(true);
        console.log('caught error scheduling');
      });
    sendEventToFirebase(eventId, htmlLink);
  };

  const moveCalendarEvent = async () => {
    console.log('move selected calendar to: ', selectedCalendar);
    console.log('old calendar: ', calendarId);

    //TODO - FIX BUG - when you save from a dead firebase event

    const moveEventURL =
      'https://www.googleapis.com/calendar/v3/calendars/' +
      calendarId +
      '/events/' +
      eventId +
      '/move?destination=' +
      selectedCalendar;
    const postOpts = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + credential?.accessToken,
      },
    };
    await fetch(moveEventURL, postOpts)
      .then((response) => response.json())
      .then((json) => {
        console.log('move result ', json);
        const eventRef = doc(db, 'jobs', jobNumber, 'events', firebaseEvent.id);
        try {
          console.log(
            'trying to update calendar in move function using updatedoc'
          );
          updateDoc(eventRef, {
            calendar: selectedCalendar,
          }).then(() => {
            console.log('moved on firebase');
          });
          console.log('setcalendar id', selectedCalendar);
          setCalendarId(selectedCalendar);
        } catch (e) {
          console.log('failed moving on firebase', e);
        }
      })
      .catch((err) => {
        console.log('failure moving calendar ', err);
      });
  };

  const updateCalendarEvent = async () => {
    const putEventURL =
      'https://www.googleapis.com/calendar/v3/calendars/' +
      selectedCalendar +
      '/events/' +
      eventId;
    const event = buildEvent();
    const putOpts = {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + credential?.accessToken,
      },
      body: JSON.stringify(event),
    };
    var htmlLink: string = '';
    var eId: string = '';
    await fetch(putEventURL, putOpts)
      .then((response) => response.json())
      .then((json) => {
        htmlLink = json.htmlLink;
        eId = json.id;
        setEventId(eId);
        setCalendarId(selectedCalendar);
      })
      .catch((e) => {
        console.log('caught error scheduling');
      });
    sendEventToFirebase(eId, htmlLink);
  };

  const deleteCalendarEvent = useCallback(async () => {
    const calToDelete = calendarId ? calendarId : selectedCalendar;
    const deleteEventURL =
      'https://www.googleapis.com/calendar/v3/calendars/' +
      calToDelete +
      '/events/' +
      eventId;
    const deleteOpts = {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + credential?.accessToken,
      },
    };
    await fetch(deleteEventURL, deleteOpts)
      .then((resp) => {
        console.log('deleted calendar: ', resp);
      })
      .catch((e) => {
        console.log('error deleting from calendar ', e);
      });
  }, [credential?.accessToken, eventId, calendarId, selectedCalendar]);

  const deleteFirebaseEvent = useCallback(async () => {
    try {
      await deleteDoc(doc(db, 'jobs', jobNumber, 'events', firebaseEvent.id));
    } catch (e) {
      console.log('error deleting firebase ', e);
    }
    setAlertText('Event deleted');
    setAlertOpen(true);
    setDeleted(true);
  }, [firebaseEvent.id, jobNumber]);

  const handleSchedule = async () => {
    if (foundOnGoogle) {
      if (
        calendarId &&
        calendarId.length > 0 &&
        calendarId !== selectedCalendar
      ) {
        await moveCalendarEvent();
      }
      //TODO only update it if there wasn't a failure from the move above
      console.log('now update it, ', eventId);
      updateCalendarEvent();
    } else {
      console.log('add new to goog cal');
      insertCalendarEvent();
    }
    setFoundOnGoogle(true);
  };

  const handleDelete = useCallback(async () => {
    if (foundOnGoogle) {
      await deleteCalendarEvent();
    }
    deleteFirebaseEvent();
    setDeleteConfirmOpen(false);
  }, [deleteCalendarEvent, deleteFirebaseEvent, foundOnGoogle]);

  const handleRoutingChange = (event: SelectChangeEvent) => {
    setSelectedRouting(event.target.value);

    if (!!foundOnGoogle) {
      const thisRoute = routings?.filter(
        (r) => r.workCenter === event.target.value
      )[0];
      if (thisRoute) {
        if (thisRoute.cycleTime < 2) {
          setDuration('1');
        } else if (thisRoute.cycleTime < 3) {
          setDuration('2');
        } else if (thisRoute.cycleTime < 4) {
          setDuration('3');
        } else if (thisRoute.cycleTime < 5) {
          setDuration('4');
        } else if (thisRoute.cycleTime < 6) {
          setDuration('5');
        } else if (thisRoute.cycleTime < 7) {
          setDuration('6');
        } else if (thisRoute.cycleTime < 8) {
          setDuration('7');
        } else if (thisRoute.cycleTime < 9) {
          setDuration('8');
        } else if (thisRoute.cycleTime <= 10) {
          setDuration('9');
        } else if (thisRoute.cycleTime <= 11) {
          setDuration('10');
        } else if (thisRoute.cycleTime <= 12) {
          setDuration('11');
        } else {
          setDuration('12');
        }
      }
    }
  };

  const handleDurationChange = (event: SelectChangeEvent) => {
    console.log('handle duration change');
    setEventEditMode(index, true);
    setDuration(event.target.value);
  };

  const handleCalendarChange = (event: SelectChangeEvent) => {
    console.log('handle calendar event change');
    if (foundOnGoogle) {
      setSelectedCalendar(event.target.value);
      // moveCalendarEvent();
      //What happens if we redo the lookup here
    } else {
      setSelectedCalendar(event.target.value);
    }
    //TODO save teh firebase event here then also
  };

  //TODO this was the old one - delete it
  // useEffect(() => {
  //   console.log('use effect to lookup google event');
  //   //if (firebaseEvent.calendar)
  //   lookupGoogleEvent();
  // }, [firebaseEvent, lookupGoogleEvent]);

  useEffect(() => {
    console.log('new use effect to lookup the date');
    //TODO - do we want to trigger on firebaseEvent? maybe that creates a loop
    if (firebaseEvent && eventId && calendarId) {
      console.log('trying to look it up because i can');
      getCalendarEvent({
        calendarId: calendarId,
        eventId: eventId,
      });
    }
  }, [getCalendarEvent, eventId, firebaseEvent, calendarId]);

  useEffect(() => {
    console.log('use effect calendar event error: ', getCalendarEventError);
  }, [getCalendarEventError]);

  useEffect(() => {
    console.log('use effect calendar event response', getCalendarEventResponse);
    if (
      getCalendarEventResponse &&
      getCalendarEventResponse.status !== 'cancelled'
    ) {
      setFoundOnGoogle(true);
      setGoogleCalendarEvent(getCalendarEventResponse);
    }
  }, [getCalendarEventResponse]);

  useEffect(() => {
    console.log('use effect because foundongoogle', foundOnGoogle);
    if (foundOnGoogle !== undefined) {
      if (foundOnGoogle) {
        console.log('ok i found it on google');
        if (googleCalendarEvent) {
          setDateValue(dayjs(googleCalendarEvent.start.dateTime));
          let startD = dayjs(googleCalendarEvent.start.dateTime);
          let endD = dayjs(googleCalendarEvent.end.dateTime);
          setDuration(Math.ceil(endD.diff(startD, 'minutes') / 60).toString());
        }
      } else {
        console.log('setting date to ', dayjs(firebaseEvent?.updatedDueDate));
        setDateValue(dayjs(firebaseEvent?.updatedDueDate));
      }
    }
  }, [firebaseEvent?.updatedDueDate, foundOnGoogle, googleCalendarEvent]);

  const handleRefresh = async () => {
    if (firebaseEvent && eventId && calendarId) {
      getCalendarEvent({
        calendarId: calendarId,
        eventId: eventId,
      });
    }
  };

  const MenuButton = () => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleCopy = () => {
      addEvent(false, {
        id: '-1',
        calendar: selectedCalendar,
        eventId: '',
        htmlLink: '',
        routing: selectedRouting,
        updatedDueDate: dateValue?.toISOString() || '',
        description: description,
        duration: duration,
        title: title,
        addedDate: dayjs().toISOString(),
      });
    };

    return (
      <div>
        <Button
          id="menu-button"
          onClick={handleMenuOpen}
          variant="contained"
          size="medium"
        >
          Options
        </Button>
        <Menu
          elevation={0}
          id="customized-menu"
          MenuListProps={{
            'aria-labelledby': 'menu-button',
          }}
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          <MenuItem
            onClick={() => {
              handleCopy();
              handleClose();
            }}
            disableRipple
          >
            <DoubleArrowIcon />
            Copy
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() => {
              setDeleteConfirmOpen(true);
              handleClose();
            }}
            disableRipple
          >
            <DeleteForeverIcon />
            Delete
          </MenuItem>
        </Menu>
      </div>
    );
  };

  return (
    <>
      <Card variant="outlined">
        {deleted && (
          <CardContent>
            <Typography sx={{ fontSize: 16 }} color="text.primary" gutterBottom>
              Deleted Event
            </Typography>
          </CardContent>
        )}
        {!deleted && (
          <CardContent>
            <Typography sx={{ fontSize: 16 }} color="text.primary" gutterBottom>
              Schedule Event
            </Typography>
            <Grid
              container
              item
              direction="row"
              alignItems="center"
              columnGap={1}
            >
              <FormControl style={{ minWidth: 120 }}>
                <InputLabel size="small" id="routingsLabel">
                  Routings
                </InputLabel>
                {routings && (
                  <Select
                    value={selectedRouting || ''}
                    size="small"
                    labelId="routingsLabel"
                    id="selectedRouting"
                    onChange={handleRoutingChange}
                    label="Duration"
                  >
                    {routings.map((routing: Routing, idx) => (
                      <MenuItem key={idx} value={routing?.workCenter}>
                        {routing?.workCenter +
                          ' (' +
                          routing?.description +
                          ',' +
                          routing?.cycleTime +
                          ')'}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={routingBox}
                    onChange={handleChecked}
                    name={'routingBox'}
                  />
                }
                label={'In Title'}
              />
              <DateTimePicker
                timeSteps={{ hours: 1, minutes: 15 }}
                slotProps={{ textField: { size: 'small' } }}
                value={dateValue}
                onChange={(newValue) => setDateValue(newValue || dayjs())}
              />
              <FormControl style={{ minWidth: 120 }}>
                <InputLabel id="duration-label">Duration</InputLabel>
                <Select
                  value={duration}
                  size="small"
                  labelId="duration-label"
                  id="duration-select"
                  onChange={handleDurationChange}
                  label="Duration"
                >
                  <MenuItem value={'1'}>1</MenuItem>
                  <MenuItem value={'2'}>2</MenuItem>
                  <MenuItem value={'3'}>3</MenuItem>
                  <MenuItem value={'4'}>4</MenuItem>
                  <MenuItem value={'5'}>5</MenuItem>
                  <MenuItem value={'6'}>6</MenuItem>
                  <MenuItem value={'7'}>7</MenuItem>
                  <MenuItem value={'8'}>8</MenuItem>
                  <MenuItem value={'9'}>9</MenuItem>
                  <MenuItem value={'10'}>10</MenuItem>
                  <MenuItem value={'11'}>11</MenuItem>
                  <MenuItem value={'12'}>12</MenuItem>
                </Select>
              </FormControl>
              {calendars && calendars.length > 0 && (
                <FormControl style={{ minWidth: 120 }}>
                  <InputLabel id="calendarLabel">Calendar</InputLabel>
                  <Select
                    value={selectedCalendar}
                    size="small"
                    labelId="calendarLabel"
                    id="calendar-select"
                    onChange={handleCalendarChange}
                    label="Pick Calendar"
                  >
                    <MenuItem key="nocal" value="pickacalender">
                      Select A Calendar
                    </MenuItem>
                    {calendars.map((calendar) => (
                      <MenuItem key={calendar?.id} value={calendar?.id}>
                        {calendar.summary}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid
              container
              item
              direction="row"
              alignItems="center"
              columnGap={1}
            >
              <TextField
                style={{ minWidth: 300 }}
                size="small"
                id="outlined-required"
                label="Additional Title"
                value={title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setTitle(event.target.value);
                }}
              />
              <TextField
                multiline
                style={{ minWidth: 300 }}
                size="small"
                id="outlined-required"
                label="Description"
                value={description}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setDescription(event.target.value);
                }}
              />
              {calendarId &&
                calendarId.length > 0 &&
                eventId &&
                eventId?.length > 0 &&
                !foundOnGoogle && (
                  <Tooltip title="Google Calendar Item was moved or deleted">
                    <WarningIcon
                      fontSize="large"
                      sx={{ color: red[500] }}
                    ></WarningIcon>
                  </Tooltip>
                )}
              {((calendarId.length === 0 && eventId?.length === 0) ||
                (calendarId.length > 0 && !eventId)) && (
                <Tooltip title="Item not yet scheduled">
                  <WarningAmberIcon
                    fontSize="large"
                    sx={{ color: amber[500] }}
                  ></WarningAmberIcon>
                </Tooltip>
              )}
              {calendarId.length > 0 &&
                eventId?.length > 0 &&
                foundOnGoogle && (
                  <Tooltip title="Found on google">
                    <VerifiedIcon
                      fontSize="large"
                      sx={{ color: green[500] }}
                    ></VerifiedIcon>
                  </Tooltip>
                )}
              <Button
                disabled={
                  !selectedCalendar || selectedCalendar === 'pickacalender'
                }
                variant="contained"
                size="medium"
                className="saveButton"
                onClick={handleSchedule}
              >
                Save
              </Button>
              <Button
                disabled={
                  !selectedCalendar || selectedCalendar === 'pickacalender'
                }
                variant="outlined"
                size="small"
                className="handleRefresh"
                onClick={handleRefresh}
              >
                <Tooltip title="Refresh date from google calendar">
                  <RefreshIcon fontSize="large" sx={{ color: blue[500] }} />
                </Tooltip>
              </Button>
              <MenuButton></MenuButton>
            </Grid>
            {/* </Grid> */}
          </CardContent>
        )}
      </Card>
      <ConfirmationModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => handleDelete()}
        title={'Confirm Delete'}
        message={'Do you really want to delete this event?'}
      />
      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)}>
        <DialogTitle>{alertText}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Event;
