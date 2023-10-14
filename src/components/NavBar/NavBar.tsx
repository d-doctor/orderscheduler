import React from "react";
import {
  AppBar,
  Toolbar,
  CssBaseline,
  Typography,
  makeStyles,
} from "@mui/material";
import "./NavBar.css";
import { Link } from "react-router-dom";
import CalendarLogin from "../CalendarLogin/CalendarLogin";
import Login from "../Login/Login";

function Navbar() {
  return (
    <>
      {/* <CssBaseline /> */}
      <Toolbar>
        <Typography variant="h4" className="logo">
          Scheduler
        </Typography>
        <div className="navLinks">
          <Link to="/" className="link">
            Home
          </Link>
          <Link to="/schedule" className="link">
            Schedule
          </Link>
          <Link to="/settings" className="link">
            Settings
          </Link>
        </div>
        {/* <CalendarLogin /> */}
        <Login />
      </Toolbar>
    </>
  );
}
export default Navbar;
