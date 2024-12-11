document.addEventListener('DOMContentLoaded', function() {
    const cancelButton = document.getElementById('cancel-button');
    const cancelForm = document.getElementById('cancel-form');
  
    cancelButton.addEventListener('click', function() {
      cancelForm.style.display = 'flex';
    });
  
    // Close the cancel modal if user clicks outside the modal
    window.addEventListener('click', function(event) {
      if (event.target === cancelForm) {
        cancelForm.style.display = 'none';
      }
    });
  });
  