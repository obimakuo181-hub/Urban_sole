
import { auth } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

// Register a new customer
export async function registerCustomer(email, password) {
  try {
    // Create customer account
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

    // Send verification link to customer's email
    await sendEmailVerification(userCredential.user);

    // Sign out until customer verifies their email
    await signOut(auth);

    return {
      success: true,
      message:
        "Account created! Check your email for a verification link."
    };

  } catch (error) {
    console.error("Registration error:", error);

    let message = "Registration failed. Please try again.";

    if (error.code === "auth/email-already-in-use") {
      message = "This email is already registered.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    } else if (error.code === "auth/weak-password") {
      message = "Please choose a stronger password.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Too many attempts. Please try again later.";
    }

    return {
      success: false,
      message
    };
  }
}
