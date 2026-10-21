
import { registerCustomer } from "./customer-auth.js";

const signupForm = document.getElementById("signup-form");
const signupBtn = document.getElementById("signup-btn");
const signupMessage = document.getElementById("signup-message");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById(
    "signup-confirm-password"
  ).value;

  signupMessage.textContent = "";
  signupMessage.className = "";

  if (!name) {
    showMessage("Please enter your full name.", "error");
    return;
  }

  if (password.length < 8) {
    showMessage(
      "Your password must contain at least 8 characters.",
      "error"
    );
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = "Creating Account...";

  try {
    const result = await registerCustomer(email, password);

    if (result.success) {
      showMessage(result.message, "success");
      signupForm.reset();
    } else {
      showMessage(result.message, "error");
    }
  } catch (error) {
    console.error("Signup error:", error);
    showMessage(
      "Something went wrong. Please try again.",
      "error"
    );
  } finally {
    signupBtn.disabled = false;
    signupBtn.textContent = "Create Account";
  }
});

function showMessage(message, type) {
  signupMessage.textContent = message;
  signupMessage.className = type;
}
