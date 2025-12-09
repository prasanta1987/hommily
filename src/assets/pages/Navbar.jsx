import { useEffect, useState } from 'react'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from '../../firebase';
import '../css/Navbar.css'

export default function Navbar() {
    const [user, setUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                setShowModal(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleAuthAction = () => {
        if (isSignUp) {
            createUserWithEmailAndPassword(auth, email, password)
                .catch(error => alert(error.message));
        } else {
            signInWithEmailAndPassword(auth, email, password)
                .catch(error => alert(error.message));
        }
    };

    const handleSignOut = () => {
        signOut(auth).catch(error => console.error(error));
    };

    const openModal = (signUp = false) => {
        setIsSignUp(signUp);
        setShowModal(true);
        setEmail('');
        setPassword('');
    }

    return (
        <nav className="navbar">
          <div className='navbar-container'>
            <a className="navbar-brand" href="/">Hommily</a>
            <div className="navbar-actions">
                {user ? (
                    <>
                        <span>{user.email}</span>
                        <button onClick={handleSignOut}>Sign Out</button>
                    </>
                ) : (
                    <button onClick={() => openModal(false)}>Login / Sign Up</button>
                )}
            </div>
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-button" onClick={() => setShowModal(false)}>&times;</button>
                        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <button className="auth-button" onClick={handleAuthAction}>{isSignUp ? 'Sign Up' : 'Sign In'}</button>
                        <p>
                            {isSignUp ? "Already have an account? " : "Don't have an account? "}
                            <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(!isSignUp); }}>
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </a>
                        </p>
                    </div>
                </div>
            )}
            </div>
        </nav>
    )
}
