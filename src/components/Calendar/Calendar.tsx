import React, { useCallback, useEffect } from "react";
import ApiCalendar from "react-google-calendar-api";
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
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
// import { start } from 'repl';
// import { DateTime } from 'luxon';
import { useRecoilValue } from "recoil";
import { ec2TokenState, userState, credentialState } from "../../atoms/auth";

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
  cycleTime: string;
}

interface props {
  orderItem: Data;
}

const config = {
  clientId:
    "434182267777-fhh4rcscpj0acsite8331qlsiof6bc9s.apps.googleusercontent.com",
  apiKey: "AIzaSyDIGRNTgKWiW8yqyVX_axs1rmW-1IdyOoA",
  scope: "https://www.googleapis.com/auth/calendar",
  discoveryDocs: [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  ],
};

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
  const [selectedRouting, setSelectedRouting] = React.useState<string>();
  const [description, setDescription] = React.useState<string>();
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
    location: false,
    addressBox: false,
    routingBox: false,
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
            console.log("calendar json: ", json);
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
    console.log("clicked calendar " + event.target.value);
  };

  const handleRoutingChange = (event: SelectChangeEvent) => {
    setSelectedRouting(event.target.value);
    //TODO: find the routing and get the duration out of it
  };

  const handleSchedule = () => {
    const insertEventURL =
      "https://www.googleapis.com/calendar/v3/calendars/" +
      selectedCalendar +
      "/events";

    // const apiCalendar = new ApiCalendar(config);
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
    console.log("sending: ", event);
    const postOpts = {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + credential?.accessToken,
      },
      body: JSON.stringify(event),
    };
    fetch(insertEventURL, postOpts)
      .then((response) => response.json())
      .then((json) => console.log("JASON: ", json));
  };

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

  return (
    <>
      {/* Job Number (xxxxx-xx) / Customer Name / Part No / .... Resources ... Address ...  */}
      <Grid container spacing="2">
        <Grid container item xs={5} direction="column">
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
        <Grid container item xs={7} direction="column" spacing="4">
          <Grid container item direction="row" alignItems="center">
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
            <Button
              disabled={
                !selectedCalendar || selectedCalendar === "pickacalender"
              }
              variant="contained"
              size="large"
              className="login"
              onClick={handleSchedule}
            >
              {" "}
              Schedule Google Calendar{" "}
            </Button>
          </Grid>
          <Grid container item direction="row" alignItems="center">
            <FormControl style={{ minWidth: 120 }}>
              <InputLabel id="routingsLabel">Routings</InputLabel>
              {routings && (
                <Select
                  value={selectedRouting}
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
              label={"Routing"}
            />
          </Grid>
          <Grid container item direction="row" alignItems="center">
            <TextField
              size="medium"
              id="outlined-required"
              label="Description"
              value={description}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setDescription(event.target.value);
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}

export default Calendar;
