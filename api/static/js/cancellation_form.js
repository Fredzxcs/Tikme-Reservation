document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("cancellationForm");
  
    form.addEventListener("submit", function (e) {
      const reservationID = document.getElementById("reservationID").value.trim();
      const email = document.getElementById("email").value.trim();
      const reason = document.getElementById("reason").value.trim();
  
      if (!reservationID || !email || !reason) {
        e.preventDefault();
        alert("Please fill in all the fields before submitting.");
      }
    });
  });
  