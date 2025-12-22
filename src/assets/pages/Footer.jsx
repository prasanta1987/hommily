
import { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

import { updateValuesToDatabase } from "../functions/commonFunctions"

export default function Footer(props) {
  const [deviceData, setDeviceData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [userUid, setUserUid] = useState(null);


  useEffect(() => {
    if (props.deviceData && props.userData) {
      console.log(props.deviceData);
      setUserUid(props.userData.uid);
      setDeviceData(props.deviceData);
    }
  }, [props.deviceData, props.userData]);

  const handleShowModal = (device) => {
    setSelectedDevice(device);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDevice(null);
    setDeviceName('');
  };

  const handleDeviceNameChange = (e) => {
    setDeviceName(e.target.value);
  };

  const handleSaveDeviceName = () => {
    // console.log(selectedDevice);

    updateValuesToDatabase(`/device/${selectedDevice.id}`, {
      uid: userUid,
      deviceName: deviceName
    });

    handleCloseModal();
  };

  const unassignedDevices = deviceData
    ? Object.keys(deviceData)
      .map((key) => ({ id: key, ...deviceData[key] }))
      .filter((device) => device.uid == null)
    : [];

  return (

    <>
      {unassignedDevices.length > 0 && (
        <footer className='fixed-bottom text-white bg-dark p-3'>
          <div className='container'>
            <h5>Unassigned Devices</h5>
            <div className='d-flex flex-wrap justify-content-space-between'>
              {unassignedDevices.map((device) => (
                <Button
                  key={device.id}
                  // variant='outline-light'
                  className='m-1 bg-primary'
                  onClick={() => handleShowModal(device)}
                >
                  {device.deviceName}
                </Button>
              ))}
            </div>
          </div>
        </footer>
      )}

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Set Device Name</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Current Device: <strong>{selectedDevice?.deviceName}</strong>
          </p>
          <Form.Group controlId='formDeviceName'>
            <Form.Label>New Device Name</Form.Label>
            <Form.Control
              type='text'
              placeholder='Enter device name'
              value={deviceName}
              onChange={handleDeviceNameChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant='primary' onClick={handleSaveDeviceName}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
