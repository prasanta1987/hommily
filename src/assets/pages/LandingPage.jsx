import { useEffect, useState } from 'react';

import { Container } from 'react-bootstrap';

import Boards from '../components/Boards';
import Feeds from '../components/Feeds';

import { updateValuesToDatabase } from "../functions/commonFunctions"


export default function LandingPage(props) {
    const [userUid, setUserUid] = useState(null);
    const [dbData, setDBData] = useState(null);

    const boardSelection = (devCode, devFeed) => {
        const feedStatus = dbData[devCode].devFeeds[devFeed].isSelected;
        updateValuesToDatabase(`${userUid}/${devCode}/devFeeds/${devFeed}`, { "isSelected": !feedStatus });
    }

    useEffect(() => {

        if (props.userData) {
            setUserUid(props.userData.uid);
            setDBData(props.userDbData);
        } else {
            setUserUid(null);
            setDBData(null);
        }
    }, [props.userData, props.userDbData]);

    return (
        <Container fluid className='bg-dark text-light flex-grow-1 overflow-auto pb-5'>
            <Container className='d-flex justify-content-between align-items-center pt-2'>
                <div className='d-flex justify-content-start gap-3 align-items-center flex-wrap'>
                    {
                        (dbData)
                            ? Object.keys(dbData).map(data => {
                                return (
                                    <Boards
                                        key={data}
                                        sendSelectedBoard={boardSelection}
                                        boardData={dbData[data]}
                                        uid={userUid}
                                    />
                                )
                            })
                            : "No Data"
                    }
                </div>

            </Container>
            <Container className='d-flex justify-content-start gap-3 pt-2'>
                {dbData && <Feeds feedData={dbData} />}
            </Container>
        </Container>

    );
}