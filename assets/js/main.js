$(document).ready(function () {
  
  // active sidebar with body offset
  $('.js-sidebar-toggle').click(function() {
    $('.full-sidebar').toggleClass('active');
    $('.main').toggleClass('active');
    $('.short-sidebar').toggleClass('active');
  });
  
});