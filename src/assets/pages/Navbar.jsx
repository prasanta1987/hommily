import { useEffect, useState } from 'react'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { auth } from '../../firebase';
import '../css/Navbar.css'

import {
    Container, Nav, Navbar,
    Button, Modal,Form
} from 'react-bootstrap'


export default function Navigationbar() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [displayName, setDisplayName] = useState('');

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                setShow(false);
                setDisplayName(user.email);
                console.log(user)
            } else {
                setDisplayName('');
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSingIn = () => {

        signInWithEmailAndPassword(auth, email, password)
            .catch(error => alert(error.message));

    };

    const handleSingUp = () => {
        createUserWithEmailAndPassword(auth, email, password)
            .catch(error => alert(error.message));

    };

    const handleSignOut = () => {
        signOut(auth).catch(error => console.error(error));
    };


    return (
        <>
            <Navbar expand="md" bg="dark" data-bs-theme="dark">
                <Container>
                    <Navbar.Brand href="#home">Hi, {displayName}</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="#home">Home</Nav.Link>
                            <Nav.Link href="#link">Link</Nav.Link>
                        </Nav>
                        {
                            user ? <Button onClick={handleSignOut} variant="outline-danger">Log Out</Button>
                                : <Button onClick={handleShow} variant="outline-success">Login/Sing-Up</Button>

                        }
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Modal heading</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="name@example.com"
                                autoFocus
                                onChange={e => setEmail(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="exampleForm.ControlInput2">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter Your Password"
                                onChange={e => setPassword(e.target.value)}
                            />
                        </Form.Group>

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleSingIn}>
                        Sign In
                    </Button>
                    <Button variant="primary" onClick={handleSingUp}>
                        Sign Up
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
