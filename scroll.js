const textarea = document.getElementById('user-input');

// Auto height for textarea
textarea.addEventListener('keydown', function() {
  this.style.height = 'auto'; // reset height
  this.style.height = this.scrollHeight + 'px'; // set new height based on content
});