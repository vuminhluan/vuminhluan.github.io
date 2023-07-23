window.addEventListener("DOMContentLoaded", (event) => {
  const togglers = document.querySelectorAll('.js-sidebar-toggle');
  togglers.forEach((item => {
    item.addEventListener('click', function () {
      document.querySelector('.full-sidebar').classList.toggle('active');
      document.querySelector('.main').classList.toggle('active');
      document.querySelector('.short-sidebar').classList.toggle('active');
    });
  }))
});