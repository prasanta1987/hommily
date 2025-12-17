import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, dbAddress } from '../configs/firebase_config';
import { ref, onValue, get, set, update } from 'firebase/database';
import { Container, Button, Modal, Form } from 'react-bootstrap';

import { FaPlus } from 'react-icons/fa';

import Boards from '../components/Boards';
import Feeds from '../components/Feeds';

import { updateValuesToDatabase, setValueToDatabase } from "../functions/commonFunctions"


export default function LandingPage() {
    const [userUid, setUserUid] = useState(null);
    const [dbData, setDBData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deviceCode, setDeviceCode] = useState('');
    const [deviceName, setDeviceName] = useState('');

    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);

    const handleSaveDevice = () => {
        if (deviceCode && userUid) {

            const newDeviceData = {
                name: deviceName,
                deviceCode:deviceCode
            };

            updateValuesToDatabase(`/device/${deviceCode}`, { uid: userUid });
            setDeviceCode('');
            setDeviceName('');
            handleClose();
        }
    };

    const boardSelection = (devCode, devFeed) => {
        const feedStatus = dbData[devCode].devFeeds[devFeed].isSelected;
        updateValuesToDatabase(`${userUid}/${devCode}/devFeeds/${devFeed}`, { "isSelected": !feedStatus });
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

    // const updateDatabase = (reference, feed) => {
    //     const dbRef = ref(db, `${userUid}/${reference}`);
    //     update(dbRef, feed)
    //         .then(() => console.log('Data Written Successfully'))
    //         .catch(err => console.log(err));
    // }

    return (
        <Container fluid className='bg-dark text-light flex-grow-1 overflow-auto pb-5'>
            <Container className='d-flex justify-content-between align-items-center pt-2'>
                <div className='d-flex justify-content-start gap-3 align-items-center flex-wrap'>
                    {
                        (dbData)
                            ? Object.keys(dbData).map(data => {
                                return (
                                    <Boards key={data} sendSelectedBoard={boardSelection} boardData={dbData[data]} />
                                )
                            })
                            : "No Data"
                    }
                </div>

                <Button variant="primary" onClick={handleShow}>
                    <FaPlus />
                </Button>
            </Container>
            <Container className='d-flex justify-content-start gap-3 pt-2'>
                {dbData && <Feeds feedData={dbData} />}
            </Container>

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Device</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="formDeviceCode">
                            <Form.Label>Device Code</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter device code"
                                value={deviceCode}
                                onChange={(e) => setDeviceCode(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formDeviceName">
                            <Form.Label>Device Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter device name"
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                            />
                        </Form.Group>
                        <span className='text-info'>{dbAddress}</span>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSaveDevice}>
                        Save Device
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>

    );
}