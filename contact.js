const contactForm = document.getElementById("contact-form");
const formMessage = document.getElementById("form-message");

contactForm.addEventListener("submit", function (event) {

  // Prevent the page from refreshing
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  // Basic validation
  if (!name || !email || !message) {
    formMessage.textContent = "Please fill in all fields.";
    formMessage.style.color = "#c00";
    formMessage.classList.add("show");

    return;
  }

  // Show success message
  formMessage.textContent =
    "Thanks, " + name + "! Your message has been received.";

  formMessage.style.color = "#222";
  formMessage.classList.add("show");

  // Clear form
  contactForm.reset();

});
