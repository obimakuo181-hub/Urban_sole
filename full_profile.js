import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged,
  reload
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const profileForm = document.getElementById("profile-form");
const profileBtn = document.getElementById("profile-btn");
const profileMessage = document.getElementById("profile-message");
const whatsappInput = document.getElementById("profile-whatsapp");

const functionUrl =
  "https://jdqlviwvvpflsvrgpxel.supabase.co/functions/v1/customer-profile";

let currentUser = null;

function showMessage(message, type) {
  profileMessage.textContent = message;
  profileMessage.className = type;
}

// Allow numbers only
whatsappInput.addEventListener("input", () => {
  whatsappInput.value = whatsappInput.value
    .replace(/\D/g, "")
    .slice(0, 11);
});

// Check authentication
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  try {
    await reload(user);

    if (!user.emailVerified) {
      window.location.replace("login.html");
      return;
    }

    currentUser = user;

    // Check whether profile already exists
    const token = await user.getIdToken(true);

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action: "get" })
    });

    if (!response.ok) {
      throw new Error("Unable to check your profile.");
    }

    const result = await response.json();

    if (result.profile) {
      window.location.replace("index.html");
    }

  } catch (error) {
    console.error("Profile check error:", error);
    currentUser = null;
    profileBtn.disabled = true;
    showMessage(
      "Unable to verify your account. Please try again later.",
      "error"
    );
  }
});

// Save customer profile
profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showMessage("Please log in first.", "error");
    return;
  }

  const name = document.getElementById("profile-name").value.trim();

const username = document
  .getElementById("profile-username")
  .value.trim()
  .toLowerCase();

const whatsapp = whatsappInput.value.trim();
  const address = document.getElementById("profile-address").value.trim();

  if (!name) {
    showMessage("Please enter your full name.", "error");
    return;
  }

  if (!/^[0-9]{11}$/.test(whatsapp)) {
    showMessage("WhatsApp number must be exactly 11 digits.", "error");
    return;
  }

  if (!address) {
    showMessage("Please enter your delivery address.", "error");
    return;
  }

  profileBtn.disabled = true;
  profileBtn.textContent = "Saving Profile...";

  try {
    const token = await currentUser.getIdToken(true);

    const response = await fetch(functionUrl, {
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
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to save profile.");
    }

    showMessage("Profile saved successfully!", "success");

    window.location.replace("index.html");

  } catch (error) {
    console.error("Save profile error:", error);
    showMessage(error.message, "error");

  } finally {
    profileBtn.disabled = false;
    profileBtn.textContent = "Save Profile";
  }
});