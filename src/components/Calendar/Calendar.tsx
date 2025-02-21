import React, { useCallback, useEffect, useState } from 'react';
import useGetCalendarList from '../../hooks/useGetCalendarList';
// import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogActions,
  Card,
  CardContent,
  Typography,
  Divider,
  duration,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRecoilValue } from 'recoil';
import { ec2TokenState, credentialState } from '../../atoms/auth';
import {
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  doc,
  DocumentData,
  collection,
  orderBy,
  query,
  deleteDoc,
} from 'firebase/firestore';
import { db, firebaseAuth } from '../../service/firebase';
import {
  Data,
  Routing,
  ShippingAddress,
  Order,
} from '../../interfaces/VendorModels';
import { GoogCal } from '../../interfaces/GoogleModels';
import {
  FirebaseEvent,
  FirebaseNote,
  FirebaseSettings,
} from '../../interfaces/FirebaseModels';
import Event from '../Event/Event';
import dayjs from 'dayjs';
import NoteModal from '../NoteModal/NoteModal';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';

interface Props {
  orderItem: Data;
}

function Calendar({ orderItem }: Props) {
  const ec2token = useRecoilValue(ec2TokenState);
  const credential = useRecoilValue(credentialState);
  const [calendarList, setCalendarList] = useState<GoogCal[]>();
  const [order, setOrder] = useState<Order>();
  const [routings, setRoutings] = useState<Routing[]>();
  const [address, setAddress] = useState<ShippingAddress>();
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertText, setAlertText] = useState<string>('');
  const [foundOnFirebase, setFoundOnFirebase] = useState<boolean>();
  const [firebaseDocData, setFirebaseDocData] = useState<DocumentData>();
  const [descriptionPrefix, setDescriptionPrefix] = useState<string>();
  const [displayAddress, setDisplayAddress] = useState<string>();
  const [orderEvents, setOrderEvents] = useState<FirebaseEvent[]>();
  const [notes, setNotes] = useState<FirebaseNote[]>();
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
  const [eventEditMode, setEventEditMode] = useState<boolean[]>([]);
  const { getCalendarList, getCalendarListResponse, getCalendarListError } =
    useGetCalendarList();
  const [notesOpen, setNotesOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<FirebaseNote>();
  // const [eventStartDates, setEventStartDates] = useState<>(undefined);

  const getOrderURLpt1 =
    'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/orders/';
  const getOrderURLpt2 =
    '?fields=orderNumber%2CcustomerCode%2Clocation%2CcustomerDescription%2CsalesID%2CdateEntered';
  const getAddressURL =
    'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/shipping-addresses/';
  // const getRoutingsURL = 'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-routings?jobNumber=';
  const getRoutingsURL =
    'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-routings?fields=stepNumber%2CdepartmentNumber%2Cdescription%2CemployeeCode%2CpartNumber%2CworkCenter%2CcycleTime&jobNumber=';
  // const [ checkedSalesID, setCheckedSalesID ] = React.useState<boolean>();
  const getRoutingsURLSortClause = '&sort=stepNumber';
  const [checkboxState, setCheckboxState] = React.useState({
    salesID: false,
    dateEntered: false,
    orderNumber: false,
    jobNumber: true,
    partNumber: true,
    customerDescription: true,
    location: false,
    addressBox: true,
  });
  const handleChecked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckboxState({
      ...checkboxState,
      [event.target.name]: event.target.checked,
    });
    const checkboxSettings: FirebaseSettings = {
      ...checkboxState,
      [event.target.name]: event.target.checked,
    };
    try {
      await setDoc(
        doc(db, 'jobs', orderItem.jobNumber, 'settings', 'checkboxes'),
        {
          checkboxSettings,
        }
      ).then();
    } catch (e) {
      // console.log('failure saving settings', e);
    }
  };

  const {
    salesID,
    dateEntered,
    orderNumber,
    jobNumber,
    partNumber,
    customerDescription,
    location,
    addressBox,
  } = checkboxState;

  const handleAddEvent = () => {
    setButtonDisabled(true);
    addEvent(false);
    setButtonDisabled(false);
  };

  const handleAddAllEvents = () => {
    setButtonDisabled(true);
    routings?.forEach(async (routing) => {
      let duration = '';
      if (routing.cycleTime < 2) {
        duration = '1';
      } else if (routing.cycleTime < 3) {
        duration = '2';
      } else if (routing.cycleTime < 4) {
        duration = '3';
      } else if (routing.cycleTime < 5) {
        duration = '4';
      } else if (routing.cycleTime < 6) {
        duration = '5';
      } else if (routing.cycleTime < 7) {
        duration = '6';
      } else if (routing.cycleTime < 8) {
        duration = '7';
      } else if (routing.cycleTime < 9) {
        duration = '8';
      } else if (routing.cycleTime <= 10) {
        duration = '9';
      } else if (routing.cycleTime <= 11) {
        duration = '10';
      } else if (routing.cycleTime <= 12) {
        duration = '11';
      } else {
        duration = '12';
      }
      console.log('add one for this routing', routing);
      addEvent(false, {
        id: '',
        calendar: '',
        eventId: '',
        htmlLink: '',
        routing: routing.workCenter,
        updatedDueDate: '',
        description: orderItem.partDescription,
        title: '',
        addedDate: dayjs().toISOString(),
        duration: duration,
        stepNumber: routing.stepNumber,
      });
    });
    setButtonDisabled(false);
  };

  //TODO: PUT THE CALENDAR LIST IN RECOIL AND ONLY FETCH IT IF YOU NEED IT
  useEffect(() => {
    if (getCalendarListError) {
      console.log('get calendar list error', getCalendarListError);
    }
  }, [getCalendarListError]);

  useEffect(() => {
    if (getCalendarListResponse) {
      setCalendarList(getCalendarListResponse.items);
    }
  }, [getCalendarListResponse]);

  useEffect(() => {
    //TODO cehck the token
    if (orderItem && getCalendarList) {
      getCalendarList();
    }
  }, [getCalendarList, orderItem]);

  useEffect(() => {
    if ((credential?.accessToken, ec2token)) {
      // let getCalendarListURL =
      //   'https://www.googleapis.com/calendar/v3/users/me/calendarList';
      // fetch(getCalendarListURL, {
      //   headers: {
      //     accept: 'application/json',
      //     Authorization: 'Bearer ' + credential?.accessToken,
      //   },
      // }).then((response) =>
      //   response
      //     .json()
      //     .then((json) => {
      //       console.log('did i actually get calendars ', json.items);
      //       setCalendarList(json.items);
      //     })
      //     .catch((e) => {
      //       console.error('error getting calendar list', e);
      //     })
      // );

      if (orderItem && ec2token) {
        let url = getOrderURLpt1 + orderItem.orderNumber + getOrderURLpt2;
        fetch(url, {
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + ec2token,
          },
        })
          .then((response) => response.json())
          .then((json) => setOrder(json.Data))
          .catch((error) => console.error(error));
      } else {
        console.log('need order item and token to get address');
      }
      if (orderItem && ec2token) {
        let url =
          getRoutingsURL + orderItem.jobNumber + getRoutingsURLSortClause;
        fetch(url, {
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + ec2token,
          },
        })
          .then((response) => response.json())
          .then((json) => {
            console.log('routings : ', json);
            setRoutings(json.Data);
          })
          .catch((error) => console.error(error));
      }
    }
  }, [orderItem, credential?.accessToken, ec2token]);

  useEffect(() => {
    if (order) {
      let url = getAddressURL + order.customerCode + '/' + order.location;
      fetch(url, {
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer ' + ec2token,
        },
      })
        .then((response) => response.json())
        .then((json) => setAddress(json.Data))
        .catch((error) => console.error(error));
    }
  }, [order, ec2token]);

  const lookupFirebaseJob = useCallback(() => {
    const singleJobRef = doc(db, 'jobs', orderItem.jobNumber);
    try {
      let jobSnapshot = getDoc(singleJobRef);
      jobSnapshot.then((a) => {
        if (a.exists()) {
          setFoundOnFirebase(true);
          setFirebaseDocData(a.data());
          const eventsSnapshot = getDocs(
            query(
              collection(db, 'jobs', orderItem.jobNumber, 'events'),
              orderBy('addedDate')
            )
          );
          eventsSnapshot.then((a) => {
            let events = new Array<FirebaseEvent>();
            const editMode: boolean[] = [];
            a.forEach((doc) => {
              editMode.push(false);
              const docData = doc.data();
              events.push({
                id: doc.id,
                calendar: docData.calendar,
                eventId: docData.eventId,
                routing: docData.routing,
                htmlLink: docData.htmlLink,
                updatedDueDate: docData.updatedDueDate,
                description: docData.description,
                duration: docData.duration,
                title: docData.title,
                addedDate: docData.addedDate,
                stepNumber: docData.stepNumber,
              });
            });
            events.sort((a, b) => {
              const aStep = a.stepNumber ? a.stepNumber : 0;
              const bStep = b.stepNumber ? b.stepNumber : 0;
              return aStep - bStep;
            });
            setOrderEvents(events);
          });
          setButtonDisabled(false);
        } else {
          setFirebaseDocData(undefined);
          setFoundOnFirebase(false);
        }
      });
    } catch (e) {
      console.log('looking up firebase job error a', e);
    }
  }, [orderItem.jobNumber]);

  const lookupFirebaseNotes = useCallback(() => {
    try {
      const notes: FirebaseNote[] = [];
      const notesSnapshot = getDocs(
        query(
          collection(db, 'jobs', orderItem.jobNumber, 'notes'),
          orderBy('addedDate')
        )
      );
      notesSnapshot.then((n) => {
        n.forEach((note) => {
          const noteData = note.data();
          notes.push({
            id: note.id,
            addedBy: noteData.addedBy,
            addedDate: noteData.addedDate,
            text: noteData.text,
            status: noteData.status,
          });
        });
        setNotes(notes);
      });
    } catch (e) {
      console.log('error getting notes snapshot ', e);
    }
  }, [orderItem.jobNumber]);

  const lookupFirebaseOrderSettings = useCallback(async () => {
    try {
      // const settings: FirebaseSettings;
      const settingSnapshot = await getDoc(
        doc(db, 'jobs', orderItem.jobNumber, 'settings', 'checkboxes')
      );
      if (settingSnapshot.exists()) {
        console.log('do we have some settings', settingSnapshot.data());
        const settings = settingSnapshot.data().checkboxSettings;
        // settingSnapshot.``
        console.log('do we have some settings', settings);
        setCheckboxState({
          salesID: settings.salesID,
          dateEntered: settings.dateEntered,
          orderNumber: settings.orderNumber,
          jobNumber: settings.jobNumber,
          partNumber: settings.partNumber,
          customerDescription: settings.customerDescription,
          location: settings.location,
          addressBox: settings.addressBox,
        });
      }
    } catch (e) {
      console.log('error getting settings snapshot ', e);
    }
  }, [orderItem.jobNumber]);

  useEffect(() => {
    if (order) {
      lookupFirebaseNotes();
      lookupFirebaseOrderSettings();
    }
  }, [order, ec2token, lookupFirebaseNotes, lookupFirebaseOrderSettings]);

  const addEvent = useCallback(
    async (firstEvent: boolean, event?: FirebaseEvent) => {
      if (dayjs(orderItem.dueDate).isBefore(dayjs())) {
      }
      try {
        const job = doc(db, 'jobs', orderItem.jobNumber);
        const eventsCollection = collection(job, 'events');
        const defaultDate = dayjs(orderItem.dueDate).isBefore(dayjs())
          ? dayjs()
          : dayjs(orderItem.dueDate);
        await addDoc(eventsCollection, {
          event: event?.calendar || '',
          eventId: '',
          htmlLink: '',
          calendar: event?.calendar || '',
          routing: event?.routing || '',
          updatedDueDate:
            event?.updatedDueDate || defaultDate.hour(7).toISOString(),
          description: event?.description || '',
          duration: event?.duration || '',
          title: event?.title || '',
          addedDate: dayjs().toISOString(),
          stepNumber: event?.stepNumber || 0,
        }).then((a) => {
          setAlertText(
            firstEvent
              ? 'No existing calendar items found - ready to schedule'
              : 'Added Event, Ready to Schedule'
          );
          setAlertOpen(true);
          lookupFirebaseJob();
        });
      } catch (f) {
        console.log('caught error adding empty event', f);
      }
    },
    [lookupFirebaseJob, orderItem.dueDate, orderItem.jobNumber]
  );

  const addFirebaseJob = useCallback(async () => {
    try {
      await setDoc(doc(db, 'jobs', orderItem.jobNumber), {
        jobNumber: orderItem.jobNumber,
        orderNumber: orderItem.orderNumber,
        originalDueDate: orderItem.dueDate,
        udpatedBy: firebaseAuth.currentUser?.email,
      }).then((a) => {
        addEvent(true);
      });
    } catch (f) {
      setAlertText('Error sending job to SE data database');
      setAlertOpen(true);
      setButtonDisabled(false);
      console.log(f);
    }
  }, [addEvent, orderItem.dueDate, orderItem.jobNumber, orderItem.orderNumber]);

  // useEffect(() => {
  //   if (firebaseDocData) {
  //     console.log("there is firebase doc data", firebaseDocData);
  //   } else {
  //     console.log("there is no doc data");
  //   }
  // }, [firebaseDocData]);

  useEffect(() => {
    if (foundOnFirebase !== undefined) {
      if (!foundOnFirebase) {
        console.log('got to add the job');
        addFirebaseJob();
      } else {
        //TODO update the firestore at all?
        console.log('we found the job no need to add it');
      }
    }
  }, [addFirebaseJob, foundOnFirebase]);

  useEffect(() => {
    if (orderItem) {
      lookupFirebaseJob();
    }
  }, [orderItem, lookupFirebaseJob]);

  const getAddress = useCallback(() => {
    if (addressBox) {
      let gaddr = '';
      gaddr =
        address?.shippingAddress1 +
        ' ' +
        address?.shippingCity +
        ' ' +
        address?.shippingState +
        ' ' +
        address?.shippingZipCode;
      return gaddr;
    } else {
      return '';
    }
  }, [addressBox, address]);

  const getSummary = useCallback(() => {
    let description = '';
    //orderItem.partDescription
    if (salesID) {
      description += order?.salesID;
      description += ' ';
    }
    if (dateEntered) {
      description += order?.dateEntered.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
      description += ' ';
    }
    if (orderNumber) {
      description += orderItem.orderNumber;
      description += ' ';
    }
    if (jobNumber) {
      description += orderItem.jobNumber;
      description += ' ';
    }
    if (partNumber) {
      description += orderItem.partNumber;
      description += ' ';
    }
    if (customerDescription) {
      description += order?.customerDescription;
      description += ' ';
    }
    if (location) {
      description += order?.location;
      description += ' ';
    }
    return description;
  }, [
    customerDescription,
    dateEntered,
    jobNumber,
    location,
    order?.customerDescription,
    order?.dateEntered,
    order?.location,
    order?.salesID,
    orderItem.jobNumber,
    orderItem.orderNumber,
    orderItem.partNumber,
    orderNumber,
    partNumber,
    salesID,
  ]);

  useEffect(() => {
    setDescriptionPrefix(getSummary());
    setDisplayAddress(getAddress());
  }, [order, orderItem, getSummary, getAddress]);

  const handleCloseDialog = () => {
    setAlertOpen(false);
  };

  // const eventAdded = useCallback(
  //   (alert: string) => {
  //     setAlertText(alert);
  //     setAlertOpen(true);
  //     lookupFirebaseJob();
  //   },
  //   [lookupFirebaseJob]
  // );

  const setEditModeByIndex = useCallback(
    (i: number, inEdit: boolean) => {
      console.log('setting edit mode for ', i);
      setEventEditMode([...eventEditMode]);
      const newEditModes = eventEditMode;
      newEditModes[i] = inEdit;
      setEventEditMode(newEditModes);
    },
    [setEventEditMode, eventEditMode]
  );

  const isEditMode = useCallback(() => {
    console.log('is edit mode', eventEditMode?.filter((a) => !!a).length > 0);
    if (eventEditMode === undefined) {
      console.log('i lied edit mode is false');
      return false;
    } else {
      return eventEditMode.filter((a) => !!a).length > 0;
    }
  }, [eventEditMode]);

  const handleDeleteClick = useCallback((note: FirebaseNote) => {
    setSelectedNote(note);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteNote = useCallback(async () => {
    if (selectedNote) {
      try {
        await deleteDoc(
          doc(db, 'jobs', orderItem.jobNumber, 'notes', selectedNote.id)
        );
      } catch (e) {
        console.log('error deleting firebase note ', e);
      }
      setAlertText('Note deleted');
      setAlertOpen(true);
      setSelectedNote(undefined);
      lookupFirebaseNotes();
    } else {
      setAlertText('Error deleting note');
      setAlertOpen(true);
    }
    setDeleteConfirmOpen(false);
  }, [lookupFirebaseNotes, orderItem.jobNumber, selectedNote]);

  const calculateMinStartDate = useCallback(
    (eventIndex: number) => {
      let minStartDate;
      if (eventIndex > 0) {
        if (orderEvents && orderEvents[eventIndex - 1]) {
          minStartDate = dayjs(orderEvents[eventIndex - 1].updatedDueDate);
          if (orderEvents[eventIndex - 1].duration) {
            let dur = Number(orderEvents[eventIndex - 1].duration) || 0;
            minStartDate.add(dur, 'hour');
          }
        }
      } else {
        //first job to exist min start date s/b now
        minStartDate = dayjs();
        // return dayjs();
      }
      console.log('min start date: ', minStartDate);
      return minStartDate;
    },
    [orderEvents]
  );

  return (
    <>
      <Grid container spacing={2}>
        <Grid container item xs={3} direction="column" rowGap={1}>
          <FormGroup>
            <Card variant="outlined">
              <CardContent>
                <Typography sx={{ fontSize: 16 }} color="text.primary">
                  Select Details for Event Title
                </Typography>
                <Grid container item direction="row" alignItems="center">
                  <Grid item xs={3}>
                    <FormLabel>Sales ID</FormLabel>
                  </Grid>
                  <Grid item xs={9}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={salesID}
                          onChange={handleChecked}
                          name={'salesID'}
                        />
                      }
                      label={order?.salesID || 'not found'}
                    />
                  </Grid>
                </Grid>
                <Grid container item direction="row" alignItems="center">
                  <Grid item xs={3}>
                    <FormLabel>Date Entered</FormLabel>
                  </Grid>
                  <Grid item xs={9}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={dateEntered}
                          onChange={handleChecked}
                          name={'dateEntered'}
                        />
                      }
                      label={
                        order?.dateEntered.toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        }) || 'not found'
                      }
                    />
                  </Grid>
                </Grid>
                <Grid container item direction="row" alignItems="center">
                  <Grid item xs={3}>
                    <FormLabel>Order Number</FormLabel>
                  </Grid>
                  <Grid item xs={9}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={orderNumber}
                          onChange={handleChecked}
                          name={'orderNumber'}
                        />
                      }
                      label={order?.orderNumber}
                    />
                  </Grid>
                </Grid>
                <Grid container item direction="row" alignItems="center">
                  <Grid item xs={3}>
                    <FormLabel>Job Number</FormLabel>
                  </Grid>
                  <Grid item xs={9}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={jobNumber}
                          onChange={handleChecked}
                          name={'jobNumber'}
                        />
                      }
                      label={orderItem.jobNumber}
                    />
                  </Grid>
                </Grid>
                <Grid container item direction="row" alignItems="center">
                  <Grid item xs={3}>
                    <FormLabel>Part number</FormLabel>
                  </Grid>
                  <Grid item xs={9}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={partNumber}
                          onChange={handleChecked}
                          name={'partNumber'}
                        />
                      }
                      label={orderItem.partNumber}
                    />
                  </Grid>
                </Grid>
                <Grid container item direction="row" alignItems="center">
                  <Grid item xs={3}>
                    <FormLabel>Customer Name</FormLabel>
                  </Grid>
                  <Grid item xs={9}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={customerDescription}
                          onChange={handleChecked}
                          name={'customerDescription'}
                        />
                      }
                      label={order?.customerDescription}
                    />
                  </Grid>
                </Grid>
                <Grid container item direction="row" alignItems="center">
                  <Grid item xs={3}>
                    <FormLabel>Location</FormLabel>
                  </Grid>
                  <Grid item xs={9}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={location}
                          onChange={handleChecked}
                          name={'location'}
                        />
                      }
                      label={order?.location}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography
                  sx={{ fontSize: 16 }}
                  color="text.primary"
                  gutterBottom
                >
                  Select Address for Event Location
                </Typography>
                <Grid container item direction="row" alignItems="center">
                  <Grid item xs={3}>
                    <FormLabel>Address</FormLabel>
                  </Grid>
                  <Grid item xs={9}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={addressBox}
                          onChange={handleChecked}
                          name={'addressBox'}
                        />
                      }
                      label={
                        address?.shippingAddress1 ||
                        '' + address?.shippingCity ||
                        ''
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Grid container item direction="row" justifyContent="space-between">
              <Button
                variant="contained"
                size="medium"
                className="addNoteButton"
                onClick={() => {
                  setNotesOpen(true);
                }}
                disabled={buttonDisabled}
              >
                Add Note
              </Button>
              <Button
                variant="contained"
                size="medium"
                className="addAllEventsButton"
                onClick={handleAddAllEvents}
                disabled={buttonDisabled || isEditMode()}
              >
                Prefill Events
              </Button>
              <Button
                variant="contained"
                size="medium"
                className="addEventButton"
                onClick={handleAddEvent}
                disabled={buttonDisabled || isEditMode()}
              >
                Add Event
              </Button>
            </Grid>
          </FormGroup>
          {/* <Grid container item direction=""> */}

          {/* </Grid> */}
        </Grid>
        <Grid container item xs={9} direction="column" rowGap={1}>
          <Grid spacing={0} direction="row" alignItems="center" columnGap={1}>
            {firebaseDocData &&
              orderEvents &&
              descriptionPrefix &&
              orderEvents.map((fe: FirebaseEvent, idx: number) => (
                <Event
                  key={fe.addedDate}
                  routings={routings}
                  firebaseEvent={fe}
                  index={idx}
                  calendars={calendarList}
                  descriptionPrefix={descriptionPrefix}
                  address={displayAddress}
                  jobNumber={orderItem.jobNumber}
                  // eventAdded={eventAdded}
                  setEventEditMode={setEditModeByIndex}
                  addEvent={addEvent}
                  minStartDate={calculateMinStartDate(idx)}
                />
              ))}
          </Grid>
        </Grid>
        <Grid container item xs={11} direction="column" rowGap={1}>
          {notes &&
            notes.map((note: FirebaseNote, idx: number) => (
              <>
                <Grid container spacing={1} direction="row" columnGap={1}>
                  {/* <Grid item xs={11}> */}
                  <Button
                    variant="text"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(note)}
                  ></Button>
                  <Typography ml={1}>
                    {note.text} - {dayjs(note.addedDate).format('MM/DD/YYYY')} -{' '}
                    {note.addedBy}
                  </Typography>
                  {/* </Grid> */}
                  {/* <Grid item xs={1}> */}

                  {/* </Grid> */}
                </Grid>
                <Divider />
              </>
            ))}
        </Grid>
      </Grid>
      <Dialog open={alertOpen} onClose={handleCloseDialog}>
        <DialogTitle>{alertText}</DialogTitle>
        <DialogActions>
          <Button onClick={handleCloseDialog} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmationModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => handleDeleteNote()}
        title={'Confirm Delete'}
        message={'Do you really want to delete this event?'}
      />
      <NoteModal
        open={notesOpen}
        onClose={() => {
          lookupFirebaseNotes();
          setNotesOpen(false);
        }}
        jobNumber={orderItem.jobNumber}
      ></NoteModal>
    </>
  );
}

export default Calendar;
