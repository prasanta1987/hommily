import { useEffect, useState } from 'react';

import { Container } from 'react-bootstrap';
import { Modal, Button, Form } from 'react-bootstrap';

import { SiArduino } from "react-icons/si";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import Boards from '../components/Boards';
import Feeds from '../components/Feeds';

import { updateValuesToDatabase } from "../functions/commonFunctions"
import { dbAddress } from "../configs/firebase_config"
import { esp32Imports, esp32Code, esp8266Imports, esp8266Code } from '../configs/arduinoCode'


export default function LandingPage(props) {
    const [userUid, setUserUid] = useState(null);
    const [dbData, setDBData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [codeSelectedText, setCodeSelectedText] = useState('ESP32');

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

    const handleShowModal = (device) => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const codeSelected = (code) => {
        setCodeSelectedText(code);
    }


    let codeStringEsp32 =
        esp32Imports +
        `
// Use this code to connect your device to the Firebase Realtime Database
String uid = "${userUid}";
String host = "${dbAddress}";
` + esp32Code;


    let codeStringEsp8266 =
        esp8266Imports +
        `
// Use this code to connect your device to the Firebase Realtime Database
String uid = "${userUid}";
String host = "${dbAddress}";
` + esp8266Code;

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
                {
                    (userUid) && <div><SiArduino style={{ cursor: 'pointer' }} color="#0ff" size={40} onClick={handleShowModal} /></div>
                }


            </Container>
            <Container className='d-flex justify-content-start gap-3 pt-2'>
                {dbData && <Feeds feedData={dbData} />}
            </Container>

            <Modal show={showModal} fullscreen={true} onHide={handleCloseModal} centered data-bs-theme="dark">
                <Modal.Header closeButton>
                    <Modal.Title>Arduino Configuration for {codeSelectedText}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <SyntaxHighlighter language="arduino" style={vscDarkPlus}>
                        {codeSelectedText == 'ESP32' ? codeStringEsp32 : codeStringEsp8266}
                    </SyntaxHighlighter>
                </Modal.Body>
                <Modal.Footer className='d-flex justify-content-between'>
                    <Button variant='secondary' onClick={handleCloseModal}>
                        Close
                    </Button>
                    <div className='d-flex gap-3'>
                        <Button variant='success' onClick={() => codeSelected('ESP8266')}>
                            ESP8266
                        </Button>
                        <Button variant='success' onClick={() => codeSelected('ESP32')}>
                            ESP32
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

        </Container>

    );
}