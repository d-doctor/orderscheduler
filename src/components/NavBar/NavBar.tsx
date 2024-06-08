import React from 'react';
import { Toolbar, Typography } from '@mui/material';
import './NavBar.css';
import { Link } from 'react-router-dom';
import Login from '../Login/Login';
import { useRecoilValue } from 'recoil';
import { userState } from '../../atoms/auth';

function Navbar() {
  const user = useRecoilValue(userState);
  return (
    <>
      {/* <CssBaseline /> */}
      <Toolbar>
        <Typography variant="h4" className="logo">
          Scheduler
        </Typography>
        <div className="navLinks">
          {user && user.accessToken.length > 0 && (
            <>
              {/* <Link to="/" className="link">
                Home
              </Link> */}
              <Link to="/schedule" className="link">
                Schedule
              </Link>
              <Link to="/activity" className="link">
                Activity
              </Link>
            </>
          )}
        </div>
        <Login />
      </Toolbar>
    </>
  );
}
export default Navbar;
