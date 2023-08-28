import React, {useCallback, useEffect} from 'react';
import ApiCalendar from "react-google-calendar-api";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Button, Card, CardHeader, Checkbox, Chip, Stack, FormGroup, FormControlLabel, FormControl, FormLabel, Grid, InputLabel, Select, MenuItem, SelectChangeEvent, Divider } from '@mui/material';
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
    salesID: string;
    orderNumber: string;
    customerCode: string;
    customerDescription: string;
    location: string;
    dateEntered: Date;
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
    const getOrderURLpt2 = '?fields=orderNumber%2CcustomerCode%2Clocation%2CcustomerDescription%2CsalesID%2CdateEntered';
    const getAddressURL = 'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/shipping-addresses/';
    // const [ checkedSalesID, setCheckedSalesID ] = React.useState<boolean>();
    const [checkboxState, setCheckboxState] = React.useState({
        salesID: false,
        dateEntered: false,
        orderNumber: false,
        jobNumber: true,
        partNumber: true,
        customerDescription: true,
        location: false,
        addressBox: false
      });
      const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCheckboxState({
          ...checkboxState,
          [event.target.name]: event.target.checked,    
        });
      };
    
      const { salesID, dateEntered, orderNumber, jobNumber, partNumber, customerDescription, location, addressBox } = checkboxState;
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
              .then(json => setOrder(json.Data))
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
            .then(json => setAddress(json.Data))
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
    {/* Job Number (xxxxx-xx) / Customer Name / Part No / .... Resources ... Address ...  */}
        <Grid container spacing="2">
            <Grid container item xs={5} direction="column">            
                <FormGroup>
                    <Grid container item direction="row" alignItems="center">
                        <Grid item xs={3}>
                            <FormLabel>Sales ID</FormLabel>
                        </Grid>
                        <Grid item xs={9}>
                            <FormControlLabel control={<Checkbox checked={salesID} onChange={handleChecked} name={"salesID"} />} label={order?.salesID || 'not found'}/>
                        </Grid>
                    </Grid> 
                    <Grid container item direction="row" alignItems="center">
                        <Grid item xs={3}>
                        <FormLabel>Date Entered</FormLabel>
                        </Grid>
                        <Grid item xs={9}>
                            <FormControlLabel control={<Checkbox checked={dateEntered} onChange={handleChecked} name={"dateEntered"} />} label={order?.dateEntered.toLocaleString() || 'not found'}/>
                        </Grid>
                    </Grid>
                    <Grid container item direction="row" alignItems="center">
                        <Grid item xs={3}>
                            <FormLabel>Order Number</FormLabel>
                        </Grid>
                        <Grid item xs={9}>
                            <FormControlLabel control={<Checkbox checked={orderNumber} onChange={handleChecked} name={"orderNumber"}  />} label={order?.orderNumber}/>
                        </Grid>
                    </Grid>
                    <Grid container item direction="row" alignItems="center">
                        <Grid item xs={3}>
                            <FormLabel>Job Number</FormLabel>
                        </Grid>
                        <Grid item xs={9}>
                            <FormControlLabel control={<Checkbox checked={jobNumber} onChange={handleChecked} name={"jobNumber"} />} label={orderItem.jobNumber}/>
                        </Grid>                        
                    </Grid> 
                    <Grid container item direction="row" alignItems="center">
                        <Grid item xs={3}>
                            <FormLabel>Part number</FormLabel>
                        </Grid>
                        <Grid item xs={9}>
                            <FormControlLabel control={<Checkbox checked={partNumber} onChange={handleChecked} name={"partNumber"}/>} label={orderItem.partNumber}/>
                        </Grid>
                    </Grid> 
                    <Grid container item direction="row" alignItems="center">
                        <Grid item xs={3}>
                            <FormLabel>Customer Name</FormLabel>
                        </Grid>
                        <Grid item xs={9}>
                            <FormControlLabel control={<Checkbox checked={customerDescription} onChange={handleChecked} name={"customerDescription"}/>} label={order?.customerDescription}/>
                        </Grid>
                    </Grid>
                    <Grid container item direction="row" alignItems="center">
                        <Grid item xs={3}>
                            <FormLabel>Location</FormLabel>
                        </Grid>
                        <Grid item xs={9}>
                            <FormControlLabel control={<Checkbox checked={location} onChange={handleChecked} name={"location"}/>} label={order?.location}/>
                        </Grid>
                    </Grid>
                    <Grid container item direction="row" alignItems="center">
                        <Grid item xs={3}>
                            <FormLabel>Address</FormLabel>
                        </Grid>
                        <Grid item xs={9}>
                            <FormControlLabel control={<Checkbox checked={addressBox} onChange={handleChecked} name={"addressBox"}/>} label={address?.shippingAddress1 || '' + address?.shippingCity || ''}/>
                        </Grid>
                    </Grid>
                </FormGroup>
            </Grid>
            <Grid container item xs={7} direction="column">
                <Grid container item direction="row" alignItems="center">
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
                <Button disabled={!selectedCalendar || selectedCalendar === 'pickacalender'} variant="contained" size="large" className="login" onClick={handleSchedule}> Send to Calendar </Button>
                </Grid>
            </Grid>
        </Grid>
    </>);
}

export default Calendar;