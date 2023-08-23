import React from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import {Container, AppBar, Box, ClickAwayListener, IconButton, Grow, Menu, MenuItem, MenuList, Paper, Toolbar, Popper } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Navbar from './components/NavBar/NavBar';
import JobsList from './components/JobsList/JobsList';
import Settings from './components/Settings/Settings';
import Home from './components/Home/Home';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'


function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter basename="/"> 
        <AppBar elevation={0}>
          <Navbar />
        </AppBar>
        <Toolbar/>
      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path="/schedule" element={<JobsList/>}></Route>
        <Route path="/settings" element={<Settings/>}></Route>
      </Routes>
      {/* <Container>
        <Outlet></Outlet>      
      </Container> */}
    </BrowserRouter>
  </LocalizationProvider>
  );
}

export default App;
