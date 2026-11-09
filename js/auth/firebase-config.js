import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyALQh58eEcfL1q6K0VGLYhJwrOT15o-htA",
  authDomain: "urban-sole-743e1.firebaseapp.com",
  projectId: "urban-sole-743e1",
  storageBucket: "urban-sole-743e1.firebasestorage.app",
  messagingSenderId: "782005764286",
  appId: "1:782005764286:web:3de1f99b59e33878265eef",
  measurementId: "G-R1DCSR2RTN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Export auth for customer registration and login
export { auth };