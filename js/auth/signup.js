
import { registerCustomer } from "./customer-auth.js";

const signupForm = document.getElementById("signup-form");
const signupBtn = document.getElementById("signup-btn");
const signupMessage = document.getElementById("signup-message");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const username = document
  .getElementById("signup-username")
  .value.trim()
  .toLowerCase();
  const email = document.getElementById("signup-email").value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  showMessage("Please enter a valid email address.", "error");
  return;
  }
  const whatsapp = document.getElementById("signup-whatsapp").value.trim();
  const address = document.getElementById("signup-address").value.trim();
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
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
  showMessage(
    "Username must contain 3–20 characters. Use only lowercase letters, numbers, or underscores.",
    "error"
  );
  return;
}
  // WhatsApp number must contain exactly 11 digits
if (!/^[0-9]{11}$/.test(whatsapp)) {
  showMessage(
    "WhatsApp number must contain exactly 11 digits. No letters or spaces.",
    "error"
  );
  return;
}

// Delivery address is required
if (!address) {
  showMessage("Please enter your delivery address.", "error");
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
  const response = await fetch(
    "https://jdqlviwvvpflsvrgpxel.supabase.co/functions/v1/customer-profile",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "check_username",
        username: username
      })
    }
  );

 if (!response.ok) {
  const errorText = await response.text();

  console.error("Supabase status:", response.status);
  console.error("Supabase response:", errorText);

  throw new Error("Unable to check username availability.");
}

  const result = await response.json();

  if (!result.available) {
    showMessage(
      "This username is already taken. Please choose another.",
      "error"
    );

    signupBtn.disabled = false;
    signupBtn.textContent = "Create Account";
    return;
  }

} catch (error) {
  console.error("Username check error:", error);

  showMessage(
    "Unable to check username availability. Please try again.",
    "error"
  );

  signupBtn.disabled = false;
  signupBtn.textContent = "Create Account";
  return;
}

  try {
    const result = await registerCustomer(
  email,
  password,
  name,
  whatsapp,
  address,
  username
);

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
const whatsappInput = document.getElementById("signup-whatsapp");

whatsappInput.addEventListener("input", () => {
  whatsappInput.value = whatsappInput.value
    .replace(/\D/g, "")
    .slice(0, 11);
});
