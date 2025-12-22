import './assets/css/App.css'
import Navbar from './assets/pages/Navbar'
import Footer from './assets/pages/Footer'
import LandingPage from './assets/pages/LandingPage'

import { useEffect, useState } from 'react'

import { ref, onValue, get, set, update } from 'firebase/database';
import { auth, db, dbAddress } from './assets/configs/firebase_config';
import { updateValuesToDatabase, setValueToDatabase } from "./assets/functions/commonFunctions"

function App() {

  const [user, setUser] = useState(null);
  const [dbData, setDBData] = useState(null);
  const [newDeviceData, setNewDeviceData] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      if (user) {
        getUserDataFromDB(user.uid)
        getDeviceDataFromDB()
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const getUserDataFromDB = (uid) => {
    const dbRef = ref(db, uid);
    const unSubs = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setDBData(snapshot.val());
      } else {
        setDBData(null);
      }
    });

    return () => unSubs();
  }

  const getDeviceDataFromDB = () => {
    const dbRef = ref(db, "/device");
    const unSubs = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setNewDeviceData(snapshot.val());
      } else {
        setNewDeviceData(null);
      }
    });

    return () => unSubs();
  }

  return (
    <div className='d-flex flex-column vh-100'>
      <Navbar userData={user} />
      <LandingPage userDbData={dbData} userData={user} />
      <Footer deviceData={newDeviceData} userData={user} />
    </div>
  )
}

export default App
