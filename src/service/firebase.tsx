import { initializeApp, setLogLevel } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
const firebaseConfig = {
  apiKey: "AIzaSyDdXPJSEX91iTv0Sn5yaTDhOC_-DAhlbY4",
  authDomain: "se-data-job-scheduler.firebaseapp.com",
  databaseURL: "https://se-data-job-scheduler-default-rtdb.firebaseio.com",
  projectId: "se-data-job-scheduler",
  storageBucket: "se-data-job-scheduler.appspot.com",
  messagingSenderId: "973241811935",
  appId: "1:973241811935:web:87c9da75157e61e914ba6a",
  measurementId: "G-SVTN8EPQPC",
};

const firebaseapp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseapp);
// setLogLevel("debug");

export default firebaseapp;

export const firebaseAuth = getAuth(firebaseapp);

export { db };

// firebase.initializeApp(firebaseConfig);

// export const auth = firebase.auth();

// const provider = new firebase.auth.GoogleAuthProvider();
// provider.setCustomParameters({ prompt: "login se" });

// export const signInWithGoogle = () => auth.signInWithwithPopup(provider);

// export default firebase;
