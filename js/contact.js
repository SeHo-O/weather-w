// contact.js
const contactForm = document.getElementById("contact-form");

contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Here, you can add your code to handle form submission, e.g., send the data to a server
    alert("Thank you for your message!");
    contactForm.reset();
});