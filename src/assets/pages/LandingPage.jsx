import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { ref, onValue, get, set, update } from 'firebase/database';
import { Container, Button, Modal, Form } from 'react-bootstrap';

import Boards from '../components/Boards';
import Feeds from '../components/Feeds';


export default function LandingPage() {
    const [userUid, setUserUid] = useState(null);
    const [dbData, setDBData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deviceCode, setDeviceCode] = useState('');

    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);

    const handleSaveDevice = () => {
        if (deviceCode && userUid) {
            const newDeviceData = {
                devFeeds: {},
                devCode: deviceCode,
            };
            set(ref(db, `${userUid}/${deviceCode}`), newDeviceData)
                .then(() => {
                    console.log('Device added successfully');
                })
                .catch(err => console.log(err));
            setDeviceCode('');
            handleClose();
        }
    };

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
            <Container className='d-flex justify-content-between align-items-center pt-2'>
                <div className='d-flex justify-content-start gap-3'>
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
                    Add Device
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