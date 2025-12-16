import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { ref, onValue, get, set, update } from 'firebase/database';
import { Container } from 'react-bootstrap';

import Boards from '../components/Boards';
import Feeds from '../components/Feeds';


export default function LandingPage() {
    const [userUid, setUserUid] = useState(null);
    const [dbData, setDBData] = useState(null);

    const boardSelection = (devCode, devFeed) => {
        const feedStatus = dbData[devCode].devFeeds[devFeed].isSelected;
        updateDatabase(`${devCode}/devFeeds/${devFeed}`, { "isSelected": !feedStatus });
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

        return () => unsubscribe();
    }, []);

    const getDatFromDB = (uid) => {
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

    const updateDatabase = (reference, feed) => {
        const dbRef = ref(db, `${userUid}/${reference}`);
        update(dbRef, feed)
            .then(() => console.log('Data Written Successfully'))
            .catch(err => console.log(err));
    }

    return (
        <Container fluid className='bg-dark text-light flex-grow-1 overflow-auto pb-5'>
            <Container className='d-flex justify-content-start gap-3 pt-2'>
                {
                    (dbData)
                        ? Object.keys(dbData).map(data => {
                            return (
                                <Boards key={data} sendSelectedBoard={boardSelection} boardData={dbData[data]} />
                            )
                        })
                        : "No Data"
                }
            </Container>
            <Container className='d-flex justify-content-start gap-3 pt-2'>
                {dbData && <Feeds feedData={dbData} />}
            </Container>
        </Container>

    );
}
