
import { auth } from "./firebase-config.js";

import {
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const resetForm = document.getElementById("reset-form");
const resetEmail = document.getElementById("reset-email");
const resetMessage = document.getElementById("reset-message");
const resetBtn = document.getElementById("signup-btn");

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = resetEmail.value.trim();

  resetMessage.textContent = "";
  resetMessage.className = "";

  resetBtn.disabled = true;
  resetBtn.textContent = "Sending Reset Link...";

  try {
    await sendPasswordResetEmail(auth, email);

    showMessage(
      "If an account exists with this email, you will receive a password reset link. Please check your inbox and spam folder.",
      "success"
    );

    resetForm.reset();

  } catch (error) {
    console.error("Password reset error:", error.code);

    let message =
      "Unable to process your request. Please try again.";

    if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    } else if (error.code === "auth/too-many-requests") {
      message =
        "Too many requests. Please wait before trying again.";
    } else if (error.code === "auth/network-request-failed") {
      message =
        "Network error. Check your internet connection.";
    } else if (error.code === "auth/user-not-found") {
      // Avoid revealing whether an email is registered
      message =
        "If an account exists with this email, you will receive a password reset link.";
    }

    showMessage(message, error.code === "auth/user-not-found" ? "success" : "error");

  } finally {
    resetBtn.disabled = false;
    resetBtn.textContent = "Send Reset Link";
  }
});

function showMessage(message, type) {
  resetMessage.textContent = message;
  resetMessage.className = type;
}
