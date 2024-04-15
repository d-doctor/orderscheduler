/* eslint-disable no-restricted-globals */
import { initializeApp } from 'firebase/app'; //setLogLevel optional import
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
// import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
const firebaseConfig = {
  apiKey: 'AIzaSyDdXPJSEX91iTv0Sn5yaTDhOC_-DAhlbY4',
  authDomain: 'se-data-job-scheduler.firebaseapp.com',
  databaseURL: 'https://se-data-job-scheduler-default-rtdb.firebaseio.com',
  projectId: 'se-data-job-scheduler',
  storageBucket: 'se-data-job-scheduler.appspot.com',
  messagingSenderId: '973241811935',
  appId: '1:973241811935:web:87c9da75157e61e914ba6a',
  measurementId: 'G-SVTN8EPQPC',
};

const firebaseapp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseapp);
const auth = getAuth(firebaseapp);
const functions = getFunctions(firebaseapp, 'us-central1');

// setLogLevel('debug');

if (location.hostname === 'localhost') {
  console.log('local mode');
  // connectFirestoreEmulator(db, "127.0.0.1", 9199);
  connectFirestoreEmulator(db, 'localhost', 9199);
  // connectFunctionsEmulator(functions, 'localhost', 5001);
  // connectAuthEmulator(auth, 'http://localhost:9099');

  // setLogLevel('debug');
}

export default firebaseapp;

export const firebaseAuth = getAuth(firebaseapp);

export { db, auth, functions };

// firebase.initializeApp(firebaseConfig);

// export const auth = firebase.auth();

// const provider = new firebase.auth.GoogleAuthProvider();
// provider.setCustomParameters({ prompt: "login se" });

// export const signInWithGoogle = () => auth.signInWithwithPopup(provider);

// export default firebase;
