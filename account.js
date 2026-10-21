
import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut,
  reload
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const accountCard = document.getElementById("account-card");
const accountLoading = document.getElementById("account-loading");
const accountEmail = document.getElementById("account-email");
const accountStatus = document.getElementById("account-status");
const logoutBtn = document.getElementById("signup-btn");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  try {
    // Refresh the verification status from Firebase
    await reload(user);

    if (!user.emailVerified) {
      await signOut(auth);
      window.location.replace("login.html");
      return;
    }

    accountEmail.textContent = user.email;
    accountStatus.textContent = "Verified ✓";

    accountLoading.hidden = true;
    accountCard.hidden = false;

  } catch (error) {
    console.error("Account verification error:", error);
    accountLoading.textContent =
      "Unable to verify your account. Please refresh the page.";
  }
});

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = "Logging Out...";

  try {
    await signOut(auth);
    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout error:", error);
    alert("Unable to log out. Please try again.");

    logoutBtn.disabled = false;
    logoutBtn.textContent = "Log Out";
  }
});
