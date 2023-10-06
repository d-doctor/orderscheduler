import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBx70bRRdyez9Zd9VW_lGBkKm9jnIwt_6U",
  authDomain: "se-job-scheduler.firebaseapp.com",
  //   authDomain: "se-job-scheduler.web.app",
  projectId: "se-job-scheduler",
  appId: "",
};

const firebaseapp = initializeApp(firebaseConfig);

export default firebaseapp;

export const firebaseAuth = getAuth(firebaseapp);

// firebase.initializeApp(firebaseConfig);

// export const auth = firebase.auth();

// const provider = new firebase.auth.GoogleAuthProvider();
// provider.setCustomParameters({ prompt: "login se" });

// export const signInWithGoogle = () => auth.signInWithwithPopup(provider);

// export default firebase;
