import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { auth } from './firebase-config.js';

/**
 * Handle Sign In
 * @param {string} email 
 * @param {string} password 
 */
export const handleSignIn = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error) {
        console.error("Sign-in error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Handle Sign Up
 * @param {string} email 
 * @param {string} password 
 */
export const handleSignUp = async (email, password) => {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error) {
        console.error("Sign-up error:", error);
        let msg = "Unknown error occurred";
        if (error.message.includes("auth/email-already-in-use")) {
            msg = "User already exists";
        }
        return { success: false, error: msg };
    }
};

/**
 * Handle Sign Out
 */
export const handleSignOut = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Sign-out error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Auth State Listener
 * @param {Function} callback 
 */
export const listenToAuthState = (callback) => {
    return onAuthStateChanged(auth, callback);
};
