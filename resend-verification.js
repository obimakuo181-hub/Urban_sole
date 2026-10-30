
import { auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  reload
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const resendForm = document.getElementById("resend-form");
const resendBtn = document.getElementById("signup-btn");
const resendMessage = document.getElementById("resend-message");

resendForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("resend-email").value.trim();
  const password = document.getElementById("resend-password").value;

  resendMessage.textContent = "";
  resendMessage.className = "";

  resendBtn.disabled = true;
  resendBtn.textContent = "Sending Verification...";

  let signedIn = false;

  try {
    // Authenticate the customer
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    signedIn = true;

    // Get the latest verification status
    await reload(credential.user);

    if (credential.user.emailVerified) {
      showMessage(
        "Your email is already verified. You can log in.",
        "success"
      );
      return;
    }

    // Send another verification email
    await sendEmailVerification(credential.user);

    showMessage(
      "Verification email sent! Check your inbox and spam folder.",
      "success"
    );

    resendForm.reset();

  } catch (error) {
    console.error("Resend verification error:", error.code);

    let message =
      "Unable to send verification email. Please try again.";

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      message = "Incorrect email or password.";
    } else if (error.code === "auth/too-many-requests") {
      message =
        "Too many attempts. Please wait before trying again.";
    } else if (error.code === "auth/network-request-failed") {
      message =
        "Network error. Check your internet connection.";
    }

    showMessage(message, "error");

  } finally {
    // End the temporary session after requesting verification
    if (signedIn) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Sign-out error:", error);
      }
    }

    resendBtn.disabled = false;
    resendBtn.textContent = "Resend Verification Email";
  }
});

function showMessage(message, type) {
  resendMessage.textContent = message;
  resendMessage.className = type;
}
