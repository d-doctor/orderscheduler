import React, {useCallback, useEffect} from 'react';
import ApiCalendar from "react-google-calendar-api";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Button, Card, CardHeader, Chip, Stack, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Divider } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
// import { start } from 'repl';
// import { DateTime } from 'luxon';


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
    orderNumber: string;
    customerCode: string;
    customerDescription: string;
    location: string;
}

// interface TimeCalendarType {
//     dateTime?: string;
//     timeZone: string;
// };

interface props {
    orderItem: Data;
    token: string;
}

const config = {
    clientId: "434182267777-fhh4rcscpj0acsite8331qlsiof6bc9s.apps.googleusercontent.com",
    apiKey: "AIzaSyDIGRNTgKWiW8yqyVX_axs1rmW-1IdyOoA",
    scope: "https://www.googleapis.com/auth/calendar",
    discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    ],
};   

function Calendar({orderItem, token} : props) {
    console.log('calendar');
    const [value, setValue] = React.useState<Dayjs | null>(dayjs());
    const [duration, setDuration] = React.useState<string>('1');
    const [calendarList, setCalendarList ] = React.useState<GoogCal[]>();
    const [order, setOrder] = React.useState<Order>();
    const [address, setAddress] = React.useState<ShippingAddress>();
    const [selectedCalendar, setSelectedCalendar] = React.useState<string>('pickacalender');
    const getOrderURLpt1 = 'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/orders/'
    const getOrderURLpt2 = '?fields=orderNumber%2CcustomerCode%2Clocation%2CcustomerDescription';
    const getAddressURL = 'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/shipping-addresses/';
    //{customerCode}/{location}

    useEffect(() => {
        setValue(dayjs(orderItem.dueDate));
        const apiCalendar = new ApiCalendar(config);
        apiCalendar.listCalendars().then((response: any) => {
            console.log(response);
            if(response.status === 200) {
                console.log('set calendar', response.result.items);
                setCalendarList(response.result.items);
            } else {
                console.log('failed response from google');
            }            
        });
        if (orderItem && token) {
            let url = getOrderURLpt1 + orderItem.orderNumber + getOrderURLpt2;
            fetch(url, {headers: {'accept': 'application/json', 'Authorization': 'Bearer ' + token}})
              .then(response => response.json())
              .then(json => setOrder(json.data))
              .catch(error => console.error(error));
        } else {
            console.log('need order item and token to get address');
        }
    },[orderItem, token]);

    useEffect(() => {
        if (order) {
            let url = getAddressURL + order.customerCode + '/' + order.location;
            fetch(url, {headers: {'accept': 'application/json', 'Authorization': 'Bearer ' + token}})
            .then(response => response.json())
            .then(json => setAddress(json.data))
            .catch(error => console.error(error));
        } else {
            console.log('getting address requires order and token')
        }
    },[order, token]);

    const handleDurationChange = (event: SelectChangeEvent) => {
        setDuration(event.target.value);
    };
    
    const handleCalendarChange = (event: SelectChangeEvent) => {
        setSelectedCalendar(event.target.value);
        console.log('clicked calendar ' + event.target.value);
    }

    const handleSchedule = () => {
        const apiCalendar = new ApiCalendar(config);
        const startDate = value || dayjs();
        const endDate = startDate.add(parseInt(duration), 'hour');        
        const timeZone = "America/Chicago";
        const summary = orderItem.jobNumber + ' ' + orderItem.partNumber;
        const description = orderItem.partDescription;
        const event = {
            summary,
            description,
            start: {
              dateTime: startDate.toISOString(),
              timeZone
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone
            }
          };
        console.log('did it send: ', event);
        apiCalendar.createEvent(event, selectedCalendar, "none")
         .then((result: any) => {
            console.log('result', result);
         })
         .catch((error: any) => {
            console.log(error);
         });
    };      

    return (<>
    <Stack direction="row" spacing="3" alignItems="center">
        <Chip label={orderItem.orderNumber}/>
        <Chip label={orderItem.jobNumber}/>
        <Chip label={orderItem.partNumber}/>
        <DateTimePicker value={value} onChange={(newValue) => setValue(newValue)} />        
        <FormControl  style={{minWidth: 120}}>
          <InputLabel id="duration-label">Duration</InputLabel>
          <Select value={duration} size="medium" labelId="duration-label" id="duration-select"  onChange={handleDurationChange} label="Duration">
            <MenuItem value={'1'}>1</MenuItem>
            <MenuItem value={'2'}>2</MenuItem>
            <MenuItem value={'4'}>4</MenuItem>
            <MenuItem value={'8'}>8</MenuItem>
        </Select>
        </FormControl>
        { calendarList && calendarList.length > 0 &&
        <FormControl style={{minWidth: 120}}>
          <InputLabel id="calendarLabel">Calendar</InputLabel> 
          <Select value={selectedCalendar} size="medium" labelId="calendarLabel" id="calendar-select" onChange={handleCalendarChange} label="Pick Calendar">
            <MenuItem key="nocal" value="pickacalender">Select A Calendar</MenuItem>
          {calendarList.map((calendar) => (                
            <MenuItem key={calendar?.id} value={calendar?.id}>{calendar.summary}</MenuItem>
           ))}
        </Select>
        </FormControl>        
    }
    <Button disabled={!selectedCalendar || selectedCalendar === 'pickacalender'} variant="contained" size="medium" className="login" onClick={handleSchedule}> Send to Calendar </Button>
    </Stack>
    {/* <Divider textAlign="left">Day Outlook</Divider>    
    {selectedCalendarEvents && selectedCalendarEvents.length > 0 &&
        <Stack direction="row" spacing="3" alignItems="center">
            {selectedCalendarEvents.map((event) => {
                const date = dayjs(event.start.dateTime).toDate();
                const dayj = dayjs(event.start.dateTime);
                const time = dayj.format('LT')
                return(
                <Card variant="outlined">
                    <CardHeader title={event.summary}>
                    </CardHeader>
                        <Stack direction="column" spacing="1">
                            <div>{time}</div>
                            <div>{date.toDateString()}</div>
                        </Stack>                             
                    </Card>
                );
            })}
        </Stack>
    }         */}
    </>);
}

export default Calendar;