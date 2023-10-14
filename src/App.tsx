import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppBar, Toolbar } from "@mui/material";
import Navbar from "./components/NavBar/NavBar";
import JobsList from "./components/JobsList/JobsList";
import Settings from "./components/Settings/Settings";
import Home from "./components/Home/Home";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { RecoilRoot } from "recoil";

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <RecoilRoot>
        <BrowserRouter basename="/">
          <AppBar elevation={0}>
            <Navbar />
          </AppBar>
          <Toolbar />
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/schedule" element={<JobsList />}></Route>
            <Route path="/settings" element={<Settings />}></Route>
          </Routes>
          {/* <Container>
          <Outlet></Outlet>      
        </Container> */}
        </BrowserRouter>
      </RecoilRoot>
    </LocalizationProvider>
  );
}

export default App;
