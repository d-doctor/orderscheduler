import React, { useCallback, useEffect, useState } from "react";
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
} from "@mui/material";
import { useRecoilValue } from "recoil";
import { ec2TokenState, credentialState } from "../../atoms/auth";
import {
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  doc,
  DocumentData,
  collection,
} from "firebase/firestore";
import { firebaseAuth, db } from "../../service/firebase";
import {
  Data,
  Routing,
  ShippingAddress,
  Order,
} from "../../interfaces/VendorModels";
import { GoogCal } from "../../interfaces/GoogleModels";
import { FirebaseEvent } from "../../interfaces/FirebaseModels";
import Event from "../Event/Event";
import dayjs from "dayjs";

interface props {
  orderItem: Data;
}

function Calendar({ orderItem }: props) {
  const ec2token = useRecoilValue(ec2TokenState);
  const credential = useRecoilValue(credentialState);
  const [calendarList, setCalendarList] = useState<GoogCal[]>();
  const [order, setOrder] = useState<Order>();
  const [routings, setRoutings] = useState<Routing[]>();
  const [address, setAddress] = useState<ShippingAddress>();
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertText, setAlertText] = useState<string>("");
  const [foundOnFirebase, setFoundOnFirebase] = useState<boolean>();
  const [firebaseDocData, setFirebaseDocData] = useState<DocumentData>();
  const [descriptionPrefix, setDescriptionPrefix] = useState<string>();
  const [displayAddress, setDisplayAddress] = useState<string>();
  const [orderEvents, setOrderEvents] = useState<FirebaseEvent[]>();
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
  const getOrderURLpt1 =
    "https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/orders/";
  const getOrderURLpt2 =
    "?fields=orderNumber%2CcustomerCode%2Clocation%2CcustomerDescription%2CsalesID%2CdateEntered";
  const getAddressURL =
    "https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/shipping-addresses/";
  // const getRoutingsURL = 'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-routings?jobNumber=';
  const getRoutingsURL =
    "https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/order-routings?fields=stepNumber%2CdepartmentNumber%2Cdescription%2CemployeeCode%2CpartNumber%2CworkCenter%2CcycleTime&jobNumber=";
  // const [ checkedSalesID, setCheckedSalesID ] = React.useState<boolean>();
  const [checkboxState, setCheckboxState] = React.useState({
    salesID: false,
    dateEntered: false,
    orderNumber: false,
    jobNumber: true,
    partNumber: true,
    customerDescription: true,
    location: true,
    addressBox: true,
    routingBox: true,
  });
  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckboxState({
      ...checkboxState,
      [event.target.name]: event.target.checked,
    });
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
    addEmptyEvent(false);
    setButtonDisabled(false);
  };

  useEffect(() => {
    // setValue(dayjs(orderItem.dueDate).hour(7));
    if ((credential?.accessToken, ec2token)) {
      let getCalendarListURL =
        "https://www.googleapis.com/calendar/v3/users/me/calendarList";
      fetch(getCalendarListURL, {
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + credential?.accessToken,
        },
      }).then((response) =>
        response
          .json()
          .then((json) => {
            setCalendarList(json.items);
          })
          .catch((e) => console.error(e))
      );

      if (orderItem && ec2token) {
        let url = getOrderURLpt1 + orderItem.orderNumber + getOrderURLpt2;
        fetch(url, {
          headers: {
            accept: "application/json",
            Authorization: "Bearer " + ec2token,
          },
        })
          .then((response) => response.json())
          .then((json) => setOrder(json.Data))
          .catch((error) => console.error(error));
      } else {
        console.log("need order item and token to get address");
      }
      if (orderItem && ec2token) {
        let url = getRoutingsURL + orderItem.jobNumber;
        fetch(url, {
          headers: {
            accept: "application/json",
            Authorization: "Bearer " + ec2token,
          },
        })
          .then((response) => response.json())
          .then((json) => setRoutings(json.Data))
          .catch((error) => console.error(error));
      }
    }
  }, [orderItem, credential?.accessToken, ec2token]);

  useEffect(() => {
    if (order) {
      let url = getAddressURL + order.customerCode + "/" + order.location;
      fetch(url, {
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + ec2token,
        },
      })
        .then((response) => response.json())
        .then((json) => setAddress(json.Data))
        .catch((error) => console.error(error));
    }
  }, [order, ec2token]);

  const lookupFirebaseJob = useCallback(() => {
    const singleJobRef = doc(db, "jobs", orderItem.jobNumber);
    const jobSnapshot = getDoc(singleJobRef);
    jobSnapshot.then((a) => {
      if (a.exists()) {
        setFoundOnFirebase(true);
        setFirebaseDocData(a.data());
        const eventsSnapshot = getDocs(
          collection(db, "jobs", orderItem.jobNumber, "events")
        );
        eventsSnapshot.then((a) => {
          const events: FirebaseEvent[] = [];
          a.forEach((doc) => {
            const docData = doc.data();
            events.push({
              id: doc.id,
              calendar: docData.calendar,
              eventId: docData.eventId,
              routing: docData.routing,
              htmlLink: docData.htmlLink,
              updatedDueDate: docData.updatedDueDate,
            });
            setOrderEvents(events);
          });
        });
      } else {
        setFirebaseDocData(undefined);
        setFoundOnFirebase(false);
      }
    });
    // if (jobSnapshot.exists()) {
    // setFoundOnFirebase(true);
    //TODO remove set of doc data do we even need it here?
    // setFirebaseDocData(jobSnapshot.data());
    // console.log(
    //   "set the date to this? ",
    //   jobSnapshot.data().events[0].updatedDueDate
    // );
    // setValue(dayjs(jobSnapshot.data().events[0].updatedDueDate));
    // console.log("found the job ", jobSnapshot.data());
    // const eventsSnapshot = await getDocs(
    //   collection(db, "jobs", orderItem.jobNumber, "events")
    // );
    // console.log("HERE IS YOUR EVENTS", eventsSnapshot);
    // } else {
    //   setFirebaseDocData(undefined);
    //   setFoundOnFirebase(false);
    // }
  }, [orderItem.jobNumber]);

  const addEmptyEvent = useCallback(
    async (firstEvent: boolean) => {
      try {
        const job = doc(db, "jobs", orderItem.jobNumber);
        const eventsCollection = collection(job, "events");
        await addDoc(eventsCollection, {
          calendar: "",
          eventId: "",
          htmlLink: "",
          routing: "",
          updatedDueDate: dayjs(orderItem.dueDate).hour(7).toISOString(),
        }).then((a) => {
          setAlertText(
            firstEvent
              ? "No existing calendar items found - ready to schedule"
              : "Added Event, Ready to Schedule"
          );
          setAlertOpen(true);
          lookupFirebaseJob();
        });
      } catch (f) {
        console.log("caught error adding empty event", f);
      }
    },
    [lookupFirebaseJob, orderItem.dueDate, orderItem.jobNumber]
  );

  const addFirebaseJob = useCallback(async () => {
    try {
      await setDoc(doc(db, "jobs", orderItem.jobNumber), {
        jobNumber: orderItem.jobNumber,
        orderNumber: orderItem.orderNumber,
        originalDueDate: orderItem.dueDate,
        udpatedBy: firebaseAuth.currentUser?.email,
      }).then((a) => {
        addEmptyEvent(true);
      });
    } catch (f) {
      setAlertText("Error sending job to SE data database");
      setAlertOpen(true);
      setButtonDisabled(false);
      console.log(f);
    }
  }, [
    addEmptyEvent,
    orderItem.dueDate,
    orderItem.jobNumber,
    orderItem.orderNumber,
  ]);

  useEffect(() => {
    if (firebaseDocData) {
      console.log("there is firebase doc data", firebaseDocData);
    } else {
      console.log("there is no doc data");
    }
  }, [firebaseDocData]);

  useEffect(() => {
    if (foundOnFirebase !== undefined) {
      if (!foundOnFirebase) {
        console.log("got to add the job");
        addFirebaseJob();
      } else {
        //TODO update the firestore at all?
        console.log("we found the job no need to add it");
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
      let gaddr = "";
      gaddr =
        address?.shippingAddress1 +
        " " +
        address?.shippingCity +
        " " +
        address?.shippingState +
        " " +
        address?.shippingZipCode;
      return gaddr;
    } else {
      return "";
    }
  }, [addressBox, address]);

  const getSummary = useCallback(() => {
    let description = "";
    //orderItem.partDescription
    if (salesID) {
      description += order?.salesID;
      description += " ";
    }
    if (dateEntered) {
      description += order?.dateEntered.toLocaleString();
      description += " ";
    }
    if (orderNumber) {
      description += orderItem.orderNumber;
      description += " ";
    }
    if (jobNumber) {
      description += orderItem.jobNumber;
      description += " ";
    }
    if (partNumber) {
      description += orderItem.partNumber;
      description += " ";
    }
    if (customerDescription) {
      description += order?.customerDescription;
      description += " ";
    }
    if (location) {
      description += order?.location;
      description += " ";
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

  const eventAdded = useCallback(
    (alert: string) => {
      setAlertText(alert);
      setAlertOpen(true);
      lookupFirebaseJob();
    },
    [lookupFirebaseJob]
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
                          name={"salesID"}
                        />
                      }
                      label={order?.salesID || "not found"}
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
                          name={"dateEntered"}
                        />
                      }
                      label={order?.dateEntered.toLocaleString() || "not found"}
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
                          name={"orderNumber"}
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
                          name={"jobNumber"}
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
                          name={"partNumber"}
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
                          name={"customerDescription"}
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
                          name={"location"}
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
                          name={"addressBox"}
                        />
                      }
                      label={
                        address?.shippingAddress1 ||
                        "" + address?.shippingCity ||
                        ""
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Grid container item direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                size="medium"
                className="addEventButton"
                onClick={handleAddEvent}
                disabled={buttonDisabled}
              >
                Add Event
              </Button>
            </Grid>
          </FormGroup>
        </Grid>
        <Grid container item xs={9} direction="column" rowGap={1}>
          <Grid spacing={0} direction="row" alignItems="center" columnGap={1}>
            {firebaseDocData &&
              orderEvents &&
              descriptionPrefix &&
              orderEvents.map((fe: FirebaseEvent, idx: number) => (
                <Event
                  routings={routings}
                  firebaseEvent={fe}
                  index={idx}
                  calendars={calendarList}
                  descriptionPrefix={descriptionPrefix}
                  address={displayAddress}
                  jobNumber={orderItem.jobNumber}
                  eventAdded={eventAdded}
                />
              ))}
          </Grid>
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
    </>
  );
}

export default Calendar;
