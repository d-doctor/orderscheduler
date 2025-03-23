import React, { useCallback, useEffect } from 'react';
import { Toolbar, Typography } from '@mui/material';
import './NavBar.css';
import { Link } from 'react-router-dom';
import Login from '../Login/Login';
import { useRecoilState, useRecoilValue } from 'recoil';
import { userState } from '../../atoms/auth';
import { routingsMapState } from '../../atoms/settings';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../service/firebase';
import { FirebaseRoutingSetting } from '../../interfaces/FirebaseModels';

function Navbar() {
  const user = useRecoilValue(userState);
  const hasSettings = useCallback((val: string) => {
    return (
      val === 'oZLu4bl3pocc8q599AZHvWVCIb53' ||
      val === 'GwUJ8I1k9ZWm9iBs5s0PSPjBXnT2' ||
      val === 'IUCFVA3O5ieZCQeLedNa3ffhhSC2'
    );
  }, []);

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
              <Link to="/schedule" className="link">
                Schedule
              </Link>
              <Link to="/activity" className="link">
                Activity
              </Link>
              {user && hasSettings(user.uid) && (
                <Link to="/settings" className="link">
                  Settings
                </Link>
              )}
            </>
          )}
        </div>
        <Login />
      </Toolbar>
    </>
  );
}
export default Navbar;
