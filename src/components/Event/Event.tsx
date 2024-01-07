import React, { useCallback, useEffect, useState } from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import { useRecoilValue } from "recoil";
import { ec2TokenState, credentialState } from "../../atoms/auth";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import WarningIcon from "@mui/icons-material/Warning";
import VerifiedIcon from "@mui/icons-material/Verified";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Routing } from "../../interfaces/VendorModels";
import { FirebaseEvent } from "../../interfaces/FirebaseModels";
import { GoogCal, GoogCalEvent } from "../../interfaces/GoogleModels";
import { setDoc, doc, updateDoc } from "firebase/firestore";
import { firebaseAuth, db } from "../../service/firebase";
import { amber, green, red } from "@mui/material/colors";

interface Props {
  routings?: Routing[];
  firebaseEvent: FirebaseEvent;
  index: number;
  calendars?: GoogCal[];
  descriptionPrefix?: string;
  address?: string;
  jobNumber: string;
  eventAdded: (alert: string) => void;
}

function Event({
  routings,
  firebaseEvent,
  index,
  calendars,
  descriptionPrefix,
  address,
  jobNumber,
  eventAdded,
}: Props) {
  console.log("event componnent");
  const ec2token = useRecoilValue(ec2TokenState);
  const credential = useRecoilValue(credentialState);
  const [duration, setDuration] = useState<string>("1");
  const [selectedRouting, setSelectedRouting] = useState<string>("");
  const [dateValue, setDateValue] = useState<Dayjs | null>(dayjs());
  const [description, setDescription] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [foundOnGoogle, setFoundOnGoogle] = React.useState<boolean>();
  const [selectedCalendar, setSelectedCalendar] =
    React.useState<string>("pickacalender");
  const [oldCalendar, setOldCalendar] = React.useState<string>();
  const [checkboxState, setCheckboxState] = React.useState({
    routingBox: true,
  });
  const [googleCalendarEvent, setGoogleCalendarEvent] =
    useState<GoogCalEvent>();

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckboxState({
      ...checkboxState,
      [event.target.name]: event.target.checked,
    });
  };

  const { routingBox } = checkboxState;
  //{customerCode}/{location}

  const buildEvent = () => {
    console.log("where: ", address);
    console.log("summary, ", descriptionPrefix);
    const startDate = dateValue || dayjs();
    const endDate = startDate.add(parseInt(duration), "hour");
    const timeZone = "America/Chicago";
    // const summary = descriptionPrefix || "" + routingBox ? selectedRouting : "";
    let summary = descriptionPrefix || "";
    if (routingBox) {
      summary += " " + selectedRouting;
    }
    summary += title ? " " + title : "";
    const where = address;
    const event = {
      summary: summary,
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

  const sendEventToFirebase = async (eventId: string, htmlLink: string) => {
    try {
      console.log("trying to add with date: ", dateValue?.toISOString());
      await setDoc(doc(db, "jobs", jobNumber, "events", firebaseEvent.id), {
        calendar: selectedCalendar,
        eventId: eventId,
        htmlLink: htmlLink,
        routing: selectedRouting,
        description: description,
        title: title,
        duration: duration,
        updatedDueDate: dateValue?.toISOString() || "",
      }).then(() => {
        //TODO THIS IS PROBLEMATIC IT CLEARS THE OTHER FORMS
        eventAdded("Successfully Saved");
      });
    } catch (e) {
      console.log("failed sending to firebase", e);
      eventAdded("Failed to save to database");
    }
  };

  const insertCalendarEvent = async () => {
    const insertEventURL =
      "https://www.googleapis.com/calendar/v3/calendars/" +
      selectedCalendar +
      "/events";

    const event = buildEvent();
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
        eventAdded("Failed to save to google calendar");
        console.log("caught error scheduling");
      });
    sendEventToFirebase(eventId, htmlLink);
  };

  const moveCalendarEvent = async () => {
    //TODO this isn't getting the right selected calendar perhaps its a race condition with set state tht isn't working
    console.log("move selected calendar to: ", selectedCalendar);
    const moveEventURL =
      "https://www.googleapis.com/calendar/v3/calendars/" +
      firebaseEvent?.calendar +
      "/events/" +
      firebaseEvent?.eventId +
      "/move?destination=" +
      selectedCalendar;
    const postOpts = {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + credential?.accessToken,
      },
    };
    await fetch(moveEventURL, postOpts)
      .then((response) => response.json())
      .then((json) => {
        console.log("move result ", json);
        const eventRef = doc(db, "jobs", jobNumber, "events", firebaseEvent.id);
        try {
          console.log("trying to update calendar");
          updateDoc(eventRef, {
            calendar: selectedCalendar,
          }).then(() => {
            console.log("moved on firebase");
          });
        } catch (e) {
          console.log("failed moving on firebase", e);
        }
      })
      .catch((err) => {
        console.log("failure moving calendar ", err);
      });
  };

  const updateCalendarEvent = async () => {
    const putEventURL =
      "https://www.googleapis.com/calendar/v3/calendars/" +
      firebaseEvent?.calendar +
      "/events/" +
      firebaseEvent?.eventId;
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
        htmlLink = json.htmlLink;
        eventId = json.id;
      })
      .catch((e) => {
        console.log("caught error scheduling");
      });
    sendEventToFirebase(eventId, htmlLink);
  };

  const handleSchedule = async () => {
    if (foundOnGoogle) {
      console.log("update goog cal");
      updateCalendarEvent();
    } else {
      console.log("add new to goog cal");
      insertCalendarEvent();
    }
  };

  const handleRoutingChange = (event: SelectChangeEvent) => {
    setSelectedRouting(event.target.value);
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
      } else if (thisRoute.cycleTime <= 12) {
        setDuration("12");
      } else {
        setDuration("8");
      }
    }
  };

  const handleDurationChange = (event: SelectChangeEvent) => {
    setDuration(event.target.value);
  };

  const handleCalendarChange = (event: SelectChangeEvent) => {
    if (foundOnGoogle) {
      setOldCalendar(selectedCalendar);
      setSelectedCalendar(event.target.value);
      console.log("this is the calendar", event.target.value);
      console.log("this is the old calendar", oldCalendar);
      moveCalendarEvent();

      //What happens if we redo the lookup here
    } else {
      setSelectedCalendar(event.target.value);
    }
    //TODO - if the calendar was already set- MOVE it and save (there is an api)
    //TODO save teh firebase event here then also
  };

  const lookupGoogleEvent = useCallback(async () => {
    console.log("tryin lokoup event", firebaseEvent);
    if (
      credential?.accessToken &&
      firebaseEvent &&
      firebaseEvent.calendar &&
      firebaseEvent.eventId &&
      firebaseEvent.calendar.length > 0 &&
      firebaseEvent.eventId.length > 0
    ) {
      let getCalendarURL =
        "https://www.googleapis.com/calendar/v3/calendars/" +
        firebaseEvent.calendar +
        "/events/" +
        firebaseEvent.eventId;
      fetch(getCalendarURL, {
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + credential?.accessToken,
        },
      })
        .then((response) =>
          response.json().then((json) => {
            console.log("was the calendar json found", json);
            if (json.error) {
              setFoundOnGoogle(false);
            } else {
              setFoundOnGoogle(true);
              setGoogleCalendarEvent(json);
            }
          })
        )
        .catch((err) => {
          console.log("error fetching calendar item", err);
          setFoundOnGoogle(false);
        });
    } else {
      setFoundOnGoogle(false);
    }
  }, [firebaseEvent, credential?.accessToken]);

  useEffect(() => {
    console.log("use effect because foundongoogle", foundOnGoogle);
    if (foundOnGoogle !== undefined) {
      if (foundOnGoogle) {
        console.log("ok i found it on google");
        if (googleCalendarEvent) {
          setDateValue(dayjs(googleCalendarEvent.start.dateTime));
          let startD = dayjs(googleCalendarEvent.start.dateTime);
          let endD = dayjs(googleCalendarEvent.end.dateTime);
          setDuration(endD.diff(startD, "hours").toString());
          //this is prob a bad idea in the case where it gets rescheduled to a weird length
        }
      } else {
        console.log("setting date to ", dayjs(firebaseEvent?.updatedDueDate));
        setDateValue(dayjs(firebaseEvent?.updatedDueDate));
      }
    }
  }, [firebaseEvent?.updatedDueDate, foundOnGoogle, googleCalendarEvent]);

  useEffect(() => {
    console.log(
      "use effect to set selected calendar, ",
      firebaseEvent.calendar
    );
    setSelectedCalendar(firebaseEvent.calendar);
  }, [firebaseEvent]);

  useEffect(() => {
    console.log("use effect to lookup google event");
    //if (firebaseEvent.calendar)
    lookupGoogleEvent();
  }, [firebaseEvent, lookupGoogleEvent]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography sx={{ fontSize: 16 }} color="text.primary" gutterBottom>
          Schedule Event
        </Typography>

        <Grid container item direction="row" alignItems="center" columnGap={1}>
          <FormControl style={{ minWidth: 120 }}>
            <InputLabel size="small" id="routingsLabel">
              Routings
            </InputLabel>
            {routings && (
              <Select
                value={selectedRouting || ""}
                size="small"
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
            label={"In Title"}
          />
          <DateTimePicker
            slotProps={{ textField: { size: "small" } }}
            value={dateValue}
            onChange={(newValue) => setDateValue(newValue)}
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
              <MenuItem value={"1"}>1</MenuItem>
              <MenuItem value={"2"}>2</MenuItem>
              <MenuItem value={"4"}>4</MenuItem>
              <MenuItem value={"8"}>8</MenuItem>
              <MenuItem value={"12"}>12</MenuItem>
              <MenuItem value={"32"}>2 Days</MenuItem>
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
        <Grid container item direction="row" alignItems="center" columnGap={1}>
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
          {firebaseEvent?.calendar.length > 0 &&
            firebaseEvent?.eventId.length > 0 &&
            !foundOnGoogle && (
              <Tooltip title="Google Calendar Item was moved or deleted">
                <WarningIcon
                  fontSize="large"
                  sx={{ color: red[500] }}
                ></WarningIcon>
              </Tooltip>
            )}
          {firebaseEvent?.calendar.length === 0 &&
            firebaseEvent?.eventId.length === 0 && (
              <Tooltip title="Item not yet scheduled">
                <WarningAmberIcon
                  fontSize="large"
                  sx={{ color: amber[500] }}
                ></WarningAmberIcon>
              </Tooltip>
            )}
          {firebaseEvent?.calendar.length > 0 &&
            firebaseEvent?.eventId.length > 0 &&
            foundOnGoogle && (
              <Tooltip title="Found on google">
                <VerifiedIcon
                  fontSize="large"
                  sx={{ color: green[500] }}
                ></VerifiedIcon>
              </Tooltip>
            )}
          <Button
            disabled={!selectedCalendar || selectedCalendar === "pickacalender"}
            variant="contained"
            size="medium"
            className="saveButton"
            onClick={handleSchedule}
          >
            Save
          </Button>
        </Grid>
        {/* </Grid> */}
      </CardContent>
    </Card>
  );
}

export default Event;
