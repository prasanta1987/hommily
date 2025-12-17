import { useEffect, useState } from 'react';
import { Badge, Modal, Button, Form } from 'react-bootstrap';
import { FiHardDrive, FiChevronDown, FiChevronUp, FiEdit } from 'react-icons/fi';
import '../css/Boards.css';

export default function Boards(props) {
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [boardName, setBoardName] = useState(props.boardData.name);
    const [newBoardName, setNewBoardName] = useState(props.boardData.name);

    useEffect(() => {
        setBoardName(props.boardData.name);
        setNewBoardName(props.boardData.name);
    }, [props.boardData.name]);


    const onFeedSelect = (devCode, devFeed) => {
        props.sendSelectedBoard(devCode, devFeed);
        setIsOpen(false); // Close dropdown after selection
    };

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleShowModal = () => {
        setNewBoardName(boardName); // Reset input field to current name
        setShowModal(true);
        setIsOpen(false); // Close dropdown when opening modal
    };
    const handleCloseModal = () => setShowModal(false);

    const handleSaveName = () => {
        setBoardName(newBoardName);
        // Here you would typically call a prop function to update the name in the parent component, e.g.:
        // props.onBoardNameChange(props.boardData.deviceCode, newBoardName);
        console.log(`Board name changed to: ${newBoardName}`);
        handleCloseModal();
    };


    return (
        (props.boardData.hasOwnProperty("name") && props.boardData.hasOwnProperty("deviceCode"))
            ?
            <>
                <div className="boards-dropdown">
                    <button onClick={toggleDropdown} className="boards-dropdown-toggle">
                        <FiHardDrive className="boards-dropdown-item-icon" />
                        <span>{boardName}</span>
                        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    {isOpen && (
                        <div className="boards-dropdown-menu">
                            <div className="boards-dropdown-header">
                                {boardName}: Feeds
                                <FiEdit onClick={handleShowModal} style={{ cursor: 'pointer', marginLeft: '10px' }} />
                            </div>
                            {(props.boardData.devFeeds) &&
                                Object.keys(props.boardData.devFeeds).map(devFeed => {
                                    const isSelected = props.boardData.devFeeds[devFeed].isSelected;
                                    return (
                                        <div
                                            className={`boards-dropdown-item ${isSelected ? "selected" : ""}`}
                                            key={devFeed}
                                            onClick={() => onFeedSelect(props.boardData.deviceCode, devFeed)}
                                        >
                                            <span>{devFeed}</span>
                                            <Badge>{props.boardData.devFeeds[devFeed].value}</Badge>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    )}
                </div>

                <Modal show={showModal} onHide={handleCloseModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Board Name</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3" controlId="formBoardName">
                                <Form.Label>Board Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSaveName}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal>
            </>
            : <span>Error in Board</span>
    );
}
