import React from "react";
import { firebaseAuth } from "../../service/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Avatar, Button } from "@mui/material";
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { userState } from "../../atoms/auth";

const provider = new GoogleAuthProvider();

function Login() {
  const user = useRecoilValue(userState);
  const setUserState = useSetRecoilState(userState);

  const setUser = (user: any) => {
    setUserState(user);
  };

  const handleLoginClick = () => {
    console.log("well hi");
    signInWithPopup(firebaseAuth, provider).then((result) => {
      console.log(GoogleAuthProvider.credentialFromResult(result));
      console.log("the result", result);
      setUser(result.user);
    });
  };

  //sometimes the buttons both display seperately, need to fix that to be only one - make it a login/logout
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
      {user.accessToken.length >= 0 && (
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
