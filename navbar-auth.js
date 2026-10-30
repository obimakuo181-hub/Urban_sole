
import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const accountBtn = document.getElementById(
  "customer-account-btn"
);

if (accountBtn) {
  onAuthStateChanged(auth, (user) => {

    if (user && user.emailVerified) {
      // Customer is logged in and verified
      accountBtn.href = "account.html";
      accountBtn.title = "My Account";
      accountBtn.setAttribute(
        "aria-label",
        "My Account"
      );

    } else {
      // Customer is not logged in
      accountBtn.href = "login.html";
      accountBtn.title = "Log In";
      accountBtn.setAttribute(
        "aria-label",
        "Log In"
      );
    }

  });
}
