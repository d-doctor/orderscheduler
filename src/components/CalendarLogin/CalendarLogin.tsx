import React from 'react';
import ApiCalendar from "react-google-calendar-api";
import {Button}  from "@mui/material";
import './CalendarLogin.css';

function CalendarLogin() {

    const handleLoginClick = () => {
      apiCalendar.handleAuthClick();
    }

    const config = {
        clientId: "434182267777-fhh4rcscpj0acsite8331qlsiof6bc9s.apps.googleusercontent.com",
        apiKey: "AIzaSyDIGRNTgKWiW8yqyVX_axs1rmW-1IdyOoA",
        scope: "https://www.googleapis.com/auth/calendar",
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
      };
      
      const apiCalendar = new ApiCalendar(config);

    return (<>
    <Button variant="contained" size="medium" className="login" onClick={handleLoginClick}> Login
    </Button>
    </>);
}

export default CalendarLogin;