function showUnavailable(movieName) {
  const modal = document.getElementById('modal');
  const message = document.getElementById('modal-message');
  message.textContent = `"${movieName}" is currently unavailable. Please check back later!`;
  modal.style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    closeModal();
  }
}
