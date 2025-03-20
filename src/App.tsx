import React, { useCallback } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppBar, Toolbar } from '@mui/material';
import Navbar from './components/NavBar/NavBar';
import JobsList from './components/JobsList/JobsList';
import Settings from './components/Settings/Settings';
import Home from './components/Home/Home';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { RecoilRoot, useRecoilValue } from 'recoil';
import ActivityList from './components/ActivityList/ActivityList';
import { userState } from './atoms/auth';

function App() {
  function RouterComponent() {
    const user = useRecoilValue(userState);
    const hasSettings = useCallback((val: string) => {
      return (
        val === 'oZLu4bl3pocc8q599AZHvWVCIb53' ||
        val === 'GwUJ8I1k9ZWm9iBs5s0PSPjBXnT2' ||
        val === 'IUCFVA3O5ieZCQeLedNa3ffhhSC2'
      );
    }, []);
    return (
      <BrowserRouter basename="/">
        <AppBar elevation={0}>
          <Navbar />
        </AppBar>
        <Toolbar />
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/schedule" element={<JobsList />}></Route>
          <Route path="/activity" element={<ActivityList />}></Route>
          {user && hasSettings(user.uid) && (
            <Route path="/settings" element={<Settings />}></Route>
          )}
        </Routes>
        {/* <Container>
      <Outlet></Outlet>      
    </Container> */}
      </BrowserRouter>
    );
  }
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <RecoilRoot>
        <RouterComponent></RouterComponent>
      </RecoilRoot>
    </LocalizationProvider>
  );
}

export default App;

//"oZLu4bl3pocc8q599AZHvWVCIb53"
