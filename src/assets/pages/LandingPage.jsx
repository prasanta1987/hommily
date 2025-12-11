import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { ref, onValue, get } from 'firebase/database';
import { Container } from 'react-bootstrap'

import Boards from './Boards'


export default function LandingPage() {
    const [userUid, setUserUid] = useState(null);
    const [dbData, setDBData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBoard, setSelectedBoard] = useState(null);

    const boardSelection = (data) => {
        setSelectedBoard(data);
        console.log("Data received from child:", data);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserUid(user.uid);
                getDatFromDB(user.uid)
            } else {
                setUserUid(null);
                setDBData(null);
            }
        });

        // Cleanup subscription on unmount
        // return () => unsubscribe();
    }, []);

    const getDatFromDB = (uid) => {
        console.log(uid)

        const dbRef = ref(db, uid);
        const unSubs = onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                setDBData(snapshot.val());
                setLoading(false);
                // console.log(snapshot.val())
                // snapshot.forEach((childSnapshot) => {
                //     console.log(childSnapshot.val());
                // })
            }

        });

        return () => unSubs();

        // get(dbRef)
        // .then((snapshot) => {
        //     if (snapshot.exists()) {
        //         console.log(snapshot.val())
        //         setData(snapshot.val());
        //         setLoading(false);
        //     } else {
        //         console.log('No data available');
        //     }
        //     })
        //     .catch((error) => {
        //         console.error(error);
        //     });


    }

    return (
        <Container fluid className='bg-dark text-light'>
            <Container className='d-flex justify-content-start gap-3'>
                {
                    (dbData)
                        ? Object.keys(dbData).map(data => {
                            { return <Boards key={data} sendSelectedBoard={boardSelection} boardData={dbData[data]}></Boards> }
                        })
                        : "No Data"
                }
            </Container>
        </Container>

    );
}
