import React from "react";
import { firebaseAuth } from "../../service/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Button } from "@mui/material";

const provider = new GoogleAuthProvider();

function Login() {
  const handleLoginClick = () => {
    console.log("well hi");
    signInWithPopup(firebaseAuth, provider).then((result) => {
      console.log(GoogleAuthProvider.credentialFromResult(result));
    });
  };

  return (
    <>
      <Button
        variant="contained"
        size="medium"
        className="login"
        onClick={handleLoginClick}
      >
        Login To Continue
      </Button>
    </>
  );
}

export default Login;
