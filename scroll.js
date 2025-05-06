const textareas = document.querySelectorAll('input_1');

textareas.forEach(function(textarea) {
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });
});