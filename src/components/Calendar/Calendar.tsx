import React, { useCallback, useEffect } from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Grid,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Dialog,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
// import { start } from 'repl';
// import { DateTime } from 'luxon';
import { useRecoilValue } from "recoil";
import { ec2TokenState, userState, credentialState } from "../../atoms/auth";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  doc,
  DocumentData,
} from "firebase/firestore";
import { firebaseAuth, db } from "../../service/firebase";

interface Data {
  jobNumber: string;
  orderNumber: string;
  partNumber: string;
  partDescription: string;
  dueDate: Date;
  uniqueID: number;
  unitPrice: number;
  quantityOrdered: number;
  orderTotal: number;
  dueDateString: string;
}

interface GoogCal {
  kind: string;
  etag: string;
  accessRole: string;
  colorId: string;

  id: string;
  summary: string;
}

interface ShippingAddress {
  customerCode: string;
  shippingAddress1: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
}

interface Order {
  salesID: string;
  orderNumber: string;
  customerCode: string;
  customerDescription: string;
  location: string;
  dateEntered: Date;
}

interface Routing {
  stepNumber: number;
  departmentNumber: string;
  description: string;
  employeeCode: string;
  partNumber: string;
  workCenter: string;
  cycleTime: number;
}

interface props {
  orderItem: Data;
}

// const config = {
//   clientId:
//     "434182267777-fhh4rcscpj0acsite8331qlsiof6bc9s.apps.googleusercontent.com",
//   apiKey: "AIzaSyDIGRNTgKWiW8yqyVX_axs1rmW-1IdyOoA",
//   scope: "https://www.googleapis.com/auth/calendar",
//   discoveryDocs: [
//     "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
//   ],
// };

function Calendar({ orderItem }: props) {
  const ec2token = useRecoilValue(ec2TokenState);
  const credential = useRecoilValue(credentialState);
  const [value, setValue] = React.useState<Dayjs | null>(dayjs());
  const [duration, setDuration] = React.useState<string>("1");
  const [calendarList, setCalendarList] = React.useState<GoogCal[]>();
  const [order, setOrder] = React.useState<Order>();
  const [routings, setRoutings] = React.useState<Routing[]>();
  const [address, setAddress] = React.useState<ShippingAddress>();
  const [selectedCalendar, setSelectedCalendar] =
    React.useState<string>("pickacalender");
  const [selectedRouting, setSelectedRouting] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>();
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertText, setAlertText] = React.useState<string>("");
  const [foundOnCalendar, setFoundOnCalendar] = React.useState<boolean>(false);
  const [foundOnGoogle, setFoundOnGoogle] = React.useState<boolean>(false);
  const [firebaseDocData, setFirebaseDocData] = React.useState<DocumentData>();
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
    routingBox,
  } = checkboxState;
  //{customerCode}/{location}

  useEffect(() => {
    setValue(dayjs(orderItem.dueDate).hour(7));
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
    } else {
      console.log("getting address requires order and token");
    }
  }, [order, ec2token]);

  const handleDurationChange = (event: SelectChangeEvent) => {
    setDuration(event.target.value);
  };

  const handleCalendarChange = (event: SelectChangeEvent) => {
    setSelectedCalendar(event.target.value);
  };

  const handleRoutingChange = (event: SelectChangeEvent) => {
    setSelectedRouting(event.target.value);
    console.log("selected routing", event.target.value);
    const thisRoute = routings?.filter(
      (r) => r.workCenter === event.target.value
    )[0];
    if (thisRoute) {
      if (thisRoute.cycleTime < 1.5) {
        setDuration("1");
      } else if (thisRoute.cycleTime < 2.5) {
        setDuration("2");
      } else if (thisRoute.cycleTime < 4) {
        setDuration("4");
      } else if (thisRoute.cycleTime <= 8) {
        setDuration("8");
      } else {
        setDuration("8");
        //TODO add second calendar day automatically
      }
    }
  };

  const buildEvent = () => {
    const startDate = value || dayjs();
    const endDate = startDate.add(parseInt(duration), "hour");
    const timeZone = "America/Chicago";
    const summary = getSummary();
    const where = addressBox ? getAddress() : "";
    const event = {
      summary,
      description: description || "",
      location: where || "",
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

  const handleSchedule = async () => {
    if (foundOnCalendar) {
      updateCalendarEvent();
    } else {
      insertCalendarEvent();
    }
  };

  const insertCalendarEvent = async () => {
    const insertEventURL =
      "https://www.googleapis.com/calendar/v3/calendars/" +
      selectedCalendar +
      "/events";

    const event = buildEvent();
    // const startDate = value || dayjs();
    // const endDate = startDate.add(parseInt(duration), "hour");
    // const timeZone = "America/Chicago";
    // const summary = getSummary();
    // const where = addressBox ? getAddress() : "";
    // const event = {
    //   summary,
    //   description: description || "",
    //   location: where || "",
    //   start: {
    //     dateTime: startDate.toISOString(),
    //     timeZone,
    //   },
    //   end: {
    //     dateTime: endDate.toISOString(),
    //     timeZone,
    //   },
    // };
    const postOpts = {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + credential?.accessToken,
      },
      body: JSON.stringify(event),
    };
    var htmlLink: string = "";
    var eventId: string = "";
    await fetch(insertEventURL, postOpts)
      .then((response) => response.json())
      .then((json) => {
        console.log("INSERT RESULT: ", json);
        htmlLink = json.htmlLink;
        eventId = json.id;
      })
      .catch((e) => {
        console.log("caught error scheduling");
      });
    addFirebaseJob(htmlLink, eventId);
  };

  const updateCalendarEvent = async () => {
    const putEventURL =
      "https://www.googleapis.com/calendar/v3/calendars/" +
      firebaseDocData?.events[0].calendar +
      "/events/" +
      firebaseDocData?.events[0].eventId;
    const event = buildEvent();
    const putOpts = {
      method: "PUT",
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + credential?.accessToken,
      },
      body: JSON.stringify(event),
    };
    var htmlLink: string = "";
    var eventId: string = "";
    await fetch(putEventURL, putOpts)
      .then((response) => response.json())
      .then((json) => {
        console.log("INSERT RESULT: ", json);
        htmlLink = json.htmlLink;
        eventId = json.id;
      })
      .catch((e) => {
        console.log("caught error scheduling");
      });
    addFirebaseJob(htmlLink, eventId);
  };

  const addFirebaseJob = async (html: string, eventId: string) => {
    const events = [
      {
        calendar: selectedCalendar,
        eventId: eventId,
        htmlLink: html,
        routing: selectedRouting
          ? selectedRouting?.length > 0
            ? selectedRouting
            : ""
          : "",
        updatedDueDate: value?.toISOString(),
      },
    ];
    try {
      // const jobsref = collection(db, "/jobs", orderItem.jobNumber);
      await setDoc(doc(db, "jobs", orderItem.jobNumber), {
        jobNumber: orderItem.jobNumber,
        orderNumber: orderItem.orderNumber,
        originalDueDate: orderItem.dueDate,
        udpatedBy: firebaseAuth.currentUser?.email,
        events: events,
      }).then((a) => {
        setAlertText("Successfully scheduled calendar Event");
        setAlertOpen(true);
      });
    } catch (f) {
      setAlertText("Error sending job to SE data database");
      setAlertOpen(true);
      console.log(f);
    }
    lookupFirebaseJob();
  };

  const lookupFirebaseJob = useCallback(async () => {
    const singleJobRef = doc(db, "jobs", orderItem.jobNumber);
    const jobSnapshot = await getDoc(singleJobRef);

    if (jobSnapshot.exists()) {
      setFoundOnCalendar(true);
      setFirebaseDocData(jobSnapshot.data());
      console.log(
        "set the date to this? ",
        jobSnapshot.data().events[0].updatedDueDate
      );
      setValue(dayjs(jobSnapshot.data().events[0].updatedDueDate));
      console.log("found the job ", jobSnapshot.data());
    } else {
      setFoundOnCalendar(false);
    }
  }, [orderItem.jobNumber]);

  const lookupGoogleEvent = useCallback(async () => {
    console.log("tryin lokoup event", firebaseDocData);
    if (credential?.accessToken) {
      let getCalendarURL =
        "https://www.googleapis.com/calendar/v3/calendars/" +
        firebaseDocData?.events[0].calendar +
        "/events/" +
        firebaseDocData?.events[0].eventId;
      fetch(getCalendarURL, {
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + credential?.accessToken,
        },
      }).then((response) =>
        response.json().then((json) => {
          console.log("was the calendar json found", json);
        })
      );
    }
  }, [firebaseDocData, credential?.accessToken]);

  useEffect(() => {
    lookupFirebaseJob();
    if (foundOnCalendar) {
      console.log("is it found on calendar", foundOnCalendar);
      lookupGoogleEvent();
    }
  }, [orderItem, foundOnCalendar, lookupFirebaseJob, lookupGoogleEvent]);

  // const lookupFirebaseJob = async (jobId: string) => {
  //   try {
  //     const jobsref = collection(db, "/jobs");
  //     const q = query(jobsref);
  //     const querySnapshot = await getDocs(q);
  //     querySnapshot.forEach((doc) => {
  //       console.log("but what if i want only one");
  //       console.log(doc.id, " -> ", doc.data());
  //     });
  //   } catch (g) {
  //     console.log("caught error g: ", g);
  //   }
  //   // try {
  //   //   console.log("query another way");
  //   //   const jobsref = collection(db, "/jobs");
  //   //   console.log("query another way 2");
  //   //   const q = query(jobsref);
  //   //   console.log("query another way 3");
  //   //   onSnapshot(q, (qs) => {
  //   //     console.log("H3 CONSOLE");
  //   //     let jobs: any = [];
  //   //     qs.forEach((doc) => {
  //   //       jobs.push(doc.data());
  //   //       console.log("DOC", doc.id, " =D ", doc.data());
  //   //     });
  //   //   });
  //   // } catch (u) {
  //   //   console.log("caught error u", u);
  //   // }
  // };

  const getAddress = () => {
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
  };

  const getSummary = () => {
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
    if (routingBox) {
      description += selectedRouting;
    }
    //const { salesID, dateEntered, orderNumber, jobNumber, partNumber, customerDescription, location, addressBox, routingBox } = checkboxState;
    return description;
  };

  const handleCloseDialog = () => {
    setAlertOpen(false);
  };

  return (
    <>
      <Grid container spacing="2">
        <Grid container item xs={4} direction="column">
          <FormGroup>
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
          </FormGroup>
        </Grid>
        <Grid container xs={7} direction="column" spacing={2}>
          <Grid
            container
            item
            direction="row"
            alignItems="center"
            columnGap={1}
          >
            <FormControl style={{ minWidth: 120 }}>
              <InputLabel id="routingsLabel">Routings</InputLabel>
              {routings && (
                <Select
                  value={selectedRouting || ""}
                  size="medium"
                  labelId="routingsLabel"
                  id="selectedRouting"
                  onChange={handleRoutingChange}
                  label="Duration"
                >
                  {routings.map((routing: Routing, idx) => (
                    <MenuItem key={idx} value={routing?.workCenter}>
                      {routing?.workCenter +
                        " (" +
                        routing?.description +
                        "," +
                        routing?.cycleTime +
                        ")"}
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
                  name={"routingBox"}
                />
              }
              label={""}
            />
            <DateTimePicker
              value={value}
              onChange={(newValue) => setValue(newValue)}
            />
            <FormControl style={{ minWidth: 120 }}>
              <InputLabel id="duration-label">Duration</InputLabel>
              <Select
                value={duration}
                size="medium"
                labelId="duration-label"
                id="duration-select"
                onChange={handleDurationChange}
                label="Duration"
              >
                <MenuItem value={"1"}>1</MenuItem>
                <MenuItem value={"2"}>2</MenuItem>
                <MenuItem value={"4"}>4</MenuItem>
                <MenuItem value={"8"}>8</MenuItem>
              </Select>
            </FormControl>
            {calendarList && calendarList.length > 0 && (
              <FormControl style={{ minWidth: 120 }}>
                <InputLabel id="calendarLabel">Calendar</InputLabel>
                <Select
                  value={selectedCalendar}
                  size="medium"
                  labelId="calendarLabel"
                  id="calendar-select"
                  onChange={handleCalendarChange}
                  label="Pick Calendar"
                >
                  <MenuItem key="nocal" value="pickacalender">
                    Select A Calendar
                  </MenuItem>
                  {calendarList.map((calendar) => (
                    <MenuItem key={calendar?.id} value={calendar?.id}>
                      {calendar.summary}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              size="medium"
              id="outlined-required"
              label="Description"
              value={description}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setDescription(event.target.value);
              }}
            />
            <Button
              disabled={
                !selectedCalendar || selectedCalendar === "pickacalender"
              }
              variant="contained"
              size="medium"
              className="saveButton"
              onClick={handleSchedule}
            >
              Save
            </Button>
          </Grid>
          {/* {foundOnCalendar && (
            <Grid>
              <Button
                variant="contained"
                size="medium"
                onClick={() => {
                  window.open(firebaseDocData?.htmlLink);
                }}
              >
                View on calendar
              </Button>
            </Grid>
          )} */}
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
