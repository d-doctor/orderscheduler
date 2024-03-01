import React from 'react';
import ApiCalendar from 'react-google-calendar-api';
import { Button } from '@mui/material';
import './CalendarLogin.css';

function CalendarLogin() {
  const handleLoginClick = () => {
    // apiCalendar.handleAuthClick();
  };

  //   const apiCalendar = new ApiCalendar(config);

  return (
    <>
      <Button
        variant="contained"
        size="medium"
        className="login"
        onClick={handleLoginClick}
      >
        {' '}
        Login1
      </Button>
    </>
  );
}

export default CalendarLogin;
