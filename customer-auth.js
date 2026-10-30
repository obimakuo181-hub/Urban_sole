
import { auth } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

// Register a new customer
export async function registerCustomer(
  email,
  password,
  name,
  whatsapp,
  address,
  username
) {
  let accountCreated = false;

  try {
    // Create customer account
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      accountCreated = true;

      // Save customer profile securely before signing out
const token = await userCredential.user.getIdToken();

const response = await fetch(
  "https://jdqlviwvvpflsvrgpxel.supabase.co/functions/v1/customer-profile",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
  action: "save",
  full_name: name,
  username: username,
  whatsapp_number: whatsapp,
  delivery_address: address
})
  }
);

const profileResult = await response.json();

if (!response.ok) {
  // Firebase account exists, but profile saving failed.
  // Keep the account so the customer can recover it later.
  await signOut(auth);

  return {
    success: false,
    message:
      profileResult.error ||
      "Your account was created, but your profile could not be saved. Please log in to complete your profile."
  };
}

    // Send verification email after profile is saved
try {
  await sendEmailVerification(userCredential.user);
} catch (verificationError) {
  console.error(
    "Verification email error:",
    verificationError
  );

  await signOut(auth);

  return {
    success: false,
    message:
      "Your account and profile were saved, but we couldn't send the verification email. Please use the Resend Verification page to request a new link."
  };
}

    // Sign out until customer verifies their email
    await signOut(auth);

    return {
      success: true,
      message:
        "Account created! Check your email for a verification link."
    };

  } catch (error) {
    console.error("Registration error:", error);
    if (accountCreated) {
  try {
    await signOut(auth);
  } catch (signOutError) {
    console.error("Sign-out error:", signOutError);
  }

  return {
    success: false,
    message:
      "Your Firebase account was created, but registration could not finish. Please log in to recover your account. Do not register again with the same email."
  };
}

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
