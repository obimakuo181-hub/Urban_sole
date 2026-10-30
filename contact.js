
const contactForm = document.getElementById("contact-form");
const formMessage = document.getElementById("form-message");
const submitButton = contactForm.querySelector('button[type="submit"]');

contactForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    formMessage.textContent = "Please fill in all fields.";
    formMessage.style.color = "#c00";
    formMessage.classList.add("show");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  formMessage.textContent = "";

  try {
    await emailjs.send(
      "service_no8txgr",
      "template_0ficz0f",
      {
        user_name: name,
        user_email: email,
        user_message: message
      },
      {
        publicKey: "hN5HAIFiM2Jd1U2tw"
      }
    );

    formMessage.textContent =
      "Thanks, " + name + "! Your message has been sent successfully.";

    formMessage.style.color = "#16a34a";
    formMessage.classList.add("show");

    contactForm.reset();

  } catch (error) {
    console.error("EmailJS error:", error);

    formMessage.textContent =
      "Sorry, your message could not be sent. Please try again.";

    formMessage.style.color = "#c00";
    formMessage.classList.add("show");

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Contact Us";
  }
});
