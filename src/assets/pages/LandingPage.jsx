import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { ref, onValue, get } from 'firebase/database';

export default function LandingPage() {
    const [userUid, setUserUid] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserUid(user.uid);
                getDatFromDB(user.uid)
            } else {
                setUserUid(null);
                setData(null);
            }
        });

        // Cleanup subscription on unmount
        // return () => unsubscribe();
    }, []);

    const getDatFromDB = (uid) => {
        console.log(uid)

        const dbRef = ref(db, uid);
        onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                setData(snapshot.val());
                setLoading(false);
            }

        });
    }

    return (
        <div className="container">
            <h1>Hello</h1>
            {userUid ? <p>User ID: {userUid}</p> : <p>Not logged in</p>}

            <h2>Data from Realtime Database:</h2>
            {loading ? (
                <p>Loading data...</p>
            ) : (
                <pre>{data ? JSON.stringify(data, null, 2) : "No data found."}</pre>
            )}
        </div>
    );
}
