import React from 'react';
import { firebaseAuth, functions } from '../../service/firebase';
import { httpsCallable } from 'firebase/functions';
import {
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
} from 'firebase/auth';
import { Avatar, Button } from '@mui/material';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userState, credentialState, ec2TokenState } from '../../atoms/auth';
import { EciResult } from '../../interfaces/VendorModels';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');

function Login() {
  const user = useRecoilValue(userState);
  const setUserState = useSetRecoilState(userState);
  const setCredentialState = useSetRecoilState(credentialState);
  const setEC2TokenState = useSetRecoilState(ec2TokenState);

  const setUser = (user: any) => {
    setUserState(user);
  };

  const callFirebaseFunction = () => {
    const callableReturnMessage = httpsCallable<unknown, EciResult>(
      functions,
      'eci'
    );

    callableReturnMessage({ body: 'blank' })
      .then((result) => {
        console.log('set token to ', result.data.access_token);
        setEC2TokenState(result.data.access_token);
      })
      .catch((error) => {
        console.log('error', `${JSON.stringify(error)}`);
      });
  };

  const handleLoginClick = () => {
    signInWithPopup(firebaseAuth, provider).then((result) => {
      setUser(result.user);
      console.log('what do i ahve in the login click result', result);
      //TODO this is the correct token for calling apis apparantly
      // refresh using getIdTokenResult before it expires and set that one to the store also
      setCredentialState(GoogleAuthProvider.credentialFromResult(result));
      callFirebaseFunction();
    });
  };

  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('USER IN LOGIN COMPO ', user);
      console.log('AUTH IN  LOGIN COMPO ', auth);
      const uid = user.uid;
      const name = user.displayName;
      // ...
    } else {
      console.log('SIGNED OUT USER IN LOGIN COMPO ', user);
      console.log('SIGNED OUT AUTH IN  LOGIN COMPO ', auth);
    }
  });

  return (
    <>
      {/* <Button
        variant="contained"
        size="medium"
        className="login"
        // onClick={() => {
        //   const result = firebaseAuth.currentUser
        //     ?.getIdTokenResult()
        //     .then((e) => {
        //       console.log('what do i ahve in my promise ', e);
        //     });
        //   console.log('refresh', result);
        // }}
        onClick={() => {
          callFirebaseFunction();
        }}
      >
        function
      </Button> */}
      {user.accessToken.length <= 0 && (
        <Button
          variant="contained"
          size="medium"
          className="login"
          onClick={handleLoginClick}
        >
          Login To Continue
        </Button>
      )}
      {firebaseAuth.currentUser &&
        firebaseAuth.currentUser.displayName &&
        firebaseAuth.currentUser.displayName.length > 0 && (
          <>
            <Button variant="contained" size="medium">
              {firebaseAuth.currentUser?.displayName || ''}
              <Avatar src={user.photoURL} />
            </Button>
          </>
        )}
    </>
  );
}

export default Login;
