
import { auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut,
  reload
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("signup-btn");
const loginMessage = document.getElementById("login-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  loginMessage.textContent = "";
  loginMessage.className = "";

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging In...";

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Refresh the user's email verification status
    await reload(credential.user);

    // Block access if the email is not verified
    if (!credential.user.emailVerified) {
      await signOut(auth);

      showMessage(
        "Please verify your email address before logging in.",
        "error"
      );
      return;
    }

    const profile = await getCustomerProfile(credential.user);

    showMessage("Login successful! Redirecting...", "success");

    if (profile) {
      window.location.href = "index.html";
    } else {
      window.location.href = "full_profile.html";
    }

  } catch (error) {
    console.error("Login error:", error.code);

    let message = "Unable to log in. Please try again.";

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      message = "Incorrect email or password.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Too many attempts. Please try again later.";
    }

    showMessage(message, "error");

  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Log In";
  }
});

function showMessage(message, type) {
  loginMessage.textContent = message;
  loginMessage.className = type;
}
async function getCustomerProfile(user) {
  const token = await user.getIdToken();

  const response = await fetch(
    "https://jdqlviwvvpflsvrgpxel.supabase.co/functions/v1/customer-profile",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action: "get" })
    }
  );

  if (!response.ok) {
    throw new Error("Unable to check customer profile.");
  }

  const result = await response.json();
  return result.profile;
}