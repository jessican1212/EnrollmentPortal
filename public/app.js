import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from 
'https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc } from 
'https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js';
import data from "./verifiedEmails.json" assert {type: "json"};

const firebaseConfig = {
    apiKey: "AIzaSyBhs6qNmmg4RWYHOhs8aPdWZm4xmyiYjr0",
    authDomain: "enrollment-fd9b9.firebaseapp.com",
    projectId: "enrollment-fd9b9",
    storageBucket: "enrollment-fd9b9.appspot.com",
    messagingSenderId: "161390897043",
    appId: "1:161390897043:web:2cf041b3207ef2eec0ea66"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

signInBtn.onclick = () => signInWithPopup(auth, provider);

signOutBtn.onclick = () => {
    signOut(auth, provider);
    location.reload()
}

accept.onclick = () => {
    const email = userEmail.innerHTML;
    permissionCode.innerHTML = getCodeByEmail(email)
    track.innerHTML = getTrackByEmail(email)
    offer.hidden = true;
    whenSignedIn.hidden = false; 
    updateAccept(email)
}

decline.onclick = () => {
    if (confirm("Are you sure you want to decline your seat in CS 198-075/750? This action is final.") == true) {
        const email = userEmail.innerHTML;
        offer.hidden = true;
        declined.hidden = false;
        updateDecline(email)
    }
}

/////// FIRESTORE ////////

const db = getFirestore(app);

async function addPerson(e) {
    if (getTrackByEmail(e) == "Web Track: #33295") {
        await setDoc(doc(db, "people", getCodeByEmail(e)), {
            accepted: false,
            declined: false,
            email: e,
            track: "Web"
        });
    } else {
        await setDoc(doc(db, "people", getCodeByEmail(e)), {
            accepted: false,
            declined: false,
            email: e,
            track: "iOS"
        });
    }
}

async function getPersonFromFirestore(e) {
    const docRef = doc(db, "people", getCodeByEmail(e));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        console.log("Retrieved Existing Document");
       return docSnap.data();
    } else {
        console.log("No Such Document Exists");
       return null;
    }
}

async function updateAccept(e) {
    const docRef = doc(db, "people", getCodeByEmail(e));
    const data = {
        accepted: true
    }
    updateDoc(docRef, data)
    .then(docRef => {
        console.log("Updated Accept Value");
    })
    .catch(error => {
        console.log(error);
    })
}

async function updateDecline(e) {
    const docRef = doc(db, "people", getCodeByEmail(e));
    const data = {
        declined: true
    }
    updateDoc(docRef, data)
    .then(docRef => {
        console.log("Updated Decline Value");
    })
    .catch(error => {
        console.log(error);
    })
}

onAuthStateChanged(auth, (user) => {
    doThis(user);
});

function getCodeByEmail(email) {
    const res = data.find(el => el.email === email);
    if (res == null) {
        return null
    } else {
        return res["code"]
    }
}

function getTrackByEmail(email) {
    const res = data.find(el => el.email === email);
    if (res == null) {
        return null
    } else {
        return res["track"]
    }
}

const doThis = async (user) => {
    if (user) {
        userDetails.innerHTML = `<h2>Hello ${user.displayName}!</h2>`;
        userEmail.innerHTML = `${user.email}`;
        if (await getCodeByEmail(user.email) == null) { //not verified email
            offer.hidden = true;
            whenSignedIn.hidden = true;
            whenSignedOut.hidden = true;
            declined.hidden = false;
            unverified.innerHTML = "Oops, we couldn't find you in our database! Either you have been rejected/waitlisted or you used the wrong email. Please try again with the same email you used to apply!";
        } else {
            const p = await getPersonFromFirestore(user.email);
            if (p == null) { //first time logging in -> add to db, show offer slide
                addPerson(user.email);
                offer.hidden = false;
                whenSignedIn.hidden = true;
                whenSignedOut.hidden = true;
                declined.hidden = true;
            } else if (p["accepted"] == true) {
                offer.hidden = true;
                whenSignedIn.hidden = false;
                whenSignedOut.hidden = true;
                declined.hidden = true;
                permissionCode.innerHTML = getCodeByEmail(user.email)
                track.innerHTML = getTrackByEmail(user.email)
            } else if (p["declined"] == true) {
                offer.hidden = true;
                whenSignedIn.hidden = true;
                whenSignedOut.hidden = true;
                declined.hidden = false;
            } else { //haven't made a decision yet
                offer.hidden = false;
                whenSignedIn.hidden = true;
                whenSignedOut.hidden = true;
                declined.hidden = true;
            }
        }
    } else {
        userDetails.innerHTML = '';
        userEmail.innerHTML = '';
        offer.hidden = true;
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        declined.hidden = true;
    }
}