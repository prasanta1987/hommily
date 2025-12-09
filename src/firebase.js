// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB29axtA3Rs-zmdordgsEgAnm1VF3TI4TE",
  authDomain: "hommily.firebaseapp.com",
  databaseURL: "https://hommily-default-rtdb.firebaseio.com",
  projectId: "hommily",
  storageBucket: "hommily.firebasestorage.app",
  messagingSenderId: "755201111078",
  appId: "1:755201111078:web:1e484033a2f069786662e7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
