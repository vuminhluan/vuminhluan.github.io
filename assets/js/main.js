$(document).ready(function () {

  $('.js-print-button').on('click', function () {
    window.print();
  });

});

/*
 * Work section pill bar.
 *
 * The capability cards are the section's table of contents; once they scroll
 * away this bar becomes the same thing in a smaller form. Two jobs: decide
 * when the bar is on screen, and keep the active pill matched to whichever
 * simulation the reader is currently looking at.
 *
 * Vanilla on purpose — it shares no state with the jQuery above, and the two
 * height variables it publishes are read by CSS, including the scroll-margin
 * that stops an anchor jump from landing behind the header and the bar.
 */
(function () {
  'use strict';

  var bar = document.getElementById('work-pills');
  var cards = document.getElementById('work-cards');
  var section = document.getElementById('work');
  var header = document.querySelector('.site-header');
  if (!bar || !cards || !section) return;

  var pills = Array.prototype.slice.call(bar.querySelectorAll('[data-pill]'));
  var targets = pills.map(function (pill) {
    return document.querySelector(pill.getAttribute('data-pill'));
  });

  // A pill pointing at a simulation that is not on the page would be a dead
  // link and an index the spy could never resolve, so both sides are dropped.
  for (var i = pills.length - 1; i >= 0; i--) {
    if (!targets[i]) {
      pills[i].parentNode.remove();
      pills.splice(i, 1);
      targets.splice(i, 1);
    }
  }
  if (!pills.length) return;

  var headerH = 0;
  var barH = 0;

  function measure() {
    headerH = header ? header.offsetHeight : 0;
    // offsetHeight still reports while the bar is visibility:hidden, which is
    // why the bar is hidden that way rather than with display:none.
    barH = bar.offsetHeight;
    var root = document.documentElement;
    root.style.setProperty('--site-header-h', headerH + 'px');
    root.style.setProperty('--work-pills-h', barH + 'px');
  }

  function update() {
    ticking = false;

    // Visible from the moment the cards clear the header until the section
    // itself is gone: before that the cards say the same thing better, after
    // it the bar would be pointing back at content the reader has left.
    var visible = cards.getBoundingClientRect().bottom <= headerH &&
      section.getBoundingClientRect().bottom > headerH + barH;

    bar.classList.toggle('is-visible', visible);
    if (!visible) return;

    // The last simulation whose top has crossed the line just under the bar.
    // Reading downwards means a simulation stays active until the next one
    // actually arrives, rather than flickering between the two.
    var line = headerH + barH + 24;
    var active = 0;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].getBoundingClientRect().top <= line) active = i;
    }

    for (var j = 0; j < pills.length; j++) {
      if (j === active) {
        pills[j].setAttribute('aria-current', 'true');
      } else {
        pills[j].removeAttribute('aria-current');
      }
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  measure();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    measure();
    onScroll();
  });
})();
