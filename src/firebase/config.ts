import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVSNI4oyLxFi0aQSPmSGye9d0s7OlyURs",
  authDomain: "schedule-app-bc400.firebaseapp.com",
  projectId: "schedule-app-bc400",
  storageBucket: "schedule-app-bc400.firebasestorage.app",
  messagingSenderId: "793379503762",
  appId: "1:793379503762:web:6d8f0f4a6ab30c2877f04b",
  measurementId: "G-06SVP6QPEH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db }; 