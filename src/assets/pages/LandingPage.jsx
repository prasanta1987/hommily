import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { ref, onValue, get, set } from 'firebase/database';
import { Container, Dropdown, DropdownButton, Badge } from 'react-bootstrap'

import Boards from './Boards'


export default function LandingPage() {
    const [userUid, setUserUid] = useState(null);
    const [dbData, setDBData] = useState(null);


    const boardSelection = (devCode, devFeed) => {
        console.log("Board Selected: ", devCode);
        console.log("Feed Selected: ", devFeed);

        if (dbData[devCode].selectedFeeds) {
            dbData[devCode].selectedFeeds += "," + devFeed;
        } else {
            dbData[devCode].selectedFeeds = devFeed;
        }

        let uniFeeds = (dbData[devCode].selectedFeeds.split(","))
        uniFeeds = [...new Set(uniFeeds)]
        uniFeeds = uniFeeds.toString()

        updateDatabase(`${devCode}/selectedFeeds`, uniFeeds);
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
                // console.log(snapshot.val())
                // snapshot.forEach((childSnapshot) => {
                //     console.log(childSnapshot.val());
                // })
            }

        });

        return () => unSubs();

    }

    const updateDatabase = (reference, feed) => {

        const dbRef = ref(db, `${userUid}/${reference}`);

        set(dbRef, feed)
            .then(() => console.log('Data Written Sucssfully'))
            .catch(err => console.log(err))

    }

    return (
        <Container fluid className='bg-dark text-light'>
            <Container className='d-flex justify-content-start gap-3'>
                {
                    (dbData)
                        ? Object.keys(dbData).map(data => {
                            return (
                                <Boards key={data} sendSelectedBoard={boardSelection} boardData={dbData[data]}></Boards>
                            )
                        })
                        : "No Data"
                }
            </Container>
            <Container>
                {console.log(dbData)}
            </Container>
        </Container>

    );
}

// return <Boards key={data} sendSelectedBoard={boardSelection} boardData={dbData[data]}></Boards>

{/* <DropdownButton id="dropdown-item-button" title={dbData[data].name}>
<Dropdown.ItemText><b>{dbData[data].name}:</b> Feeds</Dropdown.ItemText>
{(dbData[data].devFeeds) &&
    Object.keys(dbData[data].devFeeds).map(devFeed => {
        return (
            <Dropdown.Item className="d-flex justify-content-between"
                key={devFeed}
                onClick={() => boardSelection(dbData[data].deviceCode, devFeed)}>
                <span>{devFeed}</span>
                <Badge>{dbData[data].devFeeds[devFeed]}</Badge>
            </Dropdown.Item>
        )
    })
}
</DropdownButton> */}