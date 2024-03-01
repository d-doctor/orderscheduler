import React from 'react';
import { firebaseAuth } from '../../service/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Avatar, Button } from '@mui/material';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userState, credentialState } from '../../atoms/auth';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');

function Login() {
  const user = useRecoilValue(userState);
  const setUserState = useSetRecoilState(userState);
  const setCredentialState = useSetRecoilState(credentialState);

  const setUser = (user: any) => {
    setUserState(user);
  };

  const handleLoginClick = () => {
    signInWithPopup(firebaseAuth, provider).then((result) => {
      setUser(result.user);
      setCredentialState(GoogleAuthProvider.credentialFromResult(result));
    });
  };

  return (
    <>
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
      {user.accessToken.length > 0 && (
        <>
          <Button variant="contained" size="medium">
            {user?.displayName}
            <Avatar src={user.photoURL} />
          </Button>
        </>
      )}
    </>
  );
}

export default Login;
