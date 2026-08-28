/*
 * UI Simulation engine.
 *
 * Two simulations, two interaction models:
 *  - Learning: free exploration. The course outline drives navigation; the
 *    slides, quiz, editor and chat are all genuinely interactive.
 *  - Meeting: a scripted walkthrough. Beats are data (embedded as JSON by the
 *    build in #sim-config); the Sim state machine runs them with auto-play,
 *    hand-over on first interaction, a beat scrubber, IntersectionObserver
 *    gating and a reduced-motion path.
 *  - Haloki: free exploration. One state object holds the linked accounts,
 *    the balance and the transactions; every phone screen is rendered
 *    from it.
 *  - Fan-out: free exploration. Publishing, reacting and deleting each run
 *    a pipeline of steps over one state object; the product surface and the
 *    two collection panels are both rendered from it.
 */
(function () {
  'use strict';

  var cfgEl = document.getElementById('sim-config');
  if (!cfgEl) return;

  var CONFIG;
  try {
    CONFIG = JSON.parse(cfgEl.textContent);
  } catch (err) {
    return;
  }

  var LOCALE = (CONFIG.locale || document.documentElement.lang || 'vi').toLowerCase();
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createTimers() {
    var pool = new Set();
    return {
      after: function (ms, fn) {
        var h = { kind: 't' };
        h.id = setTimeout(function () {
          pool.delete(h);
          fn();
        }, ms);
        pool.add(h);
        return h;
      },
      every: function (ms, fn) {
        var h = { kind: 'i', id: setInterval(fn, ms) };
        pool.add(h);
        return h;
      },
      kill: function (h) {
        if (!h) return;
        if (h.kind === 't') clearTimeout(h.id);
        else clearInterval(h.id);
        pool.delete(h);
      },
      clear: function () {
        pool.forEach(function (h) {
          if (h.kind === 't') clearTimeout(h.id);
          else clearInterval(h.id);
        });
        pool.clear();
      },
    };
  }

  function typeText(el, full, timers, done) {
    var i = 0;
    el.textContent = '';
    el.classList.add('is-typing');
    var h = timers.every(30, function () {
      i += 1;
      el.textContent = full.slice(0, i);
      if (i >= full.length) {
        timers.kill(h);
        el.classList.remove('is-typing');
        if (done) done();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Simulation 01 — Interactive Learning (free exploration)
   * ------------------------------------------------------------------ */

  function initLearning(root) {
    function $(sel) { return root.querySelector(sel); }
    function $$(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

    var el = {
      frame: $('.sim-frame'),
      lessonBtns: $$('[data-lesson-btn]'),
      progressFill: $('[data-l="progress-fill"]'),
      progressText: $('[data-l="progress-text"]'),
      stageTitle: $('[data-l="stage-title"]'),
      stageMeta: $('[data-l="stage-meta"]'),
      points: $('[data-l="points"]'),
      viewVideo: $('[data-view="video"]'),
      viewQuiz: $('[data-view="quiz"]'),
      viewHands: $('[data-view="handson"]'),
      slidesets: $$('[data-slide-for]'),
      tutor: $('.l-tutor'),
      vplay: $('[data-l="vplay"]'),
      vfill: $('[data-l="vfill"]'),
      vdur: $('[data-l="vdur"]'),
      blanks: $$('[data-quiz-blank]'),
      chips: $$('[data-quiz-chip]'),
      answer: $('[data-l="answer"]'),
      toast: $('[data-l="toast"]'),
      fixLines: $$('[data-code-line].is-fixable'),
      checks: $('[data-l="checks"]'),
      checkItems: $$('li[data-check]'),
      result: $('[data-l="result"]'),
      submit: $('[data-l="submit"]'),
      linemsg: $('[data-l="linemsg"]'),
      chatlog: $('[data-l="chatlog"]'),
      sqs: $$('[data-sq]'),
      toggleLeft: $('[data-l="toggle-left"]'),
      toggleRight: $('[data-l="toggle-right"]'),
      unread: $('.l-unread'),
      caption: $('[data-l="caption"]'),
      captionToggle: $('[data-l="caption-toggle"]'),
    };

    var avaTpl = $('.l-msg-ava');
    var unit = el.progressText.dataset.unit;
    var msgs = {};
    $$('[data-msg]').forEach(function (s) { msgs[s.dataset.msg] = s.textContent; });

    var state = { current: null, completed: {}, points: 0, graded: false, captionsOn: false, lastMsgKey: null };
    var vid = { idx: 0, playing: true, setEl: null, bullets: [] };
    var visible = false;
    var vidTimers = createTimers();
    var uiTimers = createTimers();
    var editing = null;
    var typingEl = null;

    var NEXT = { intro: 'quiz', quiz: 'fix', fix: null };

    function lessonBtn(id) {
      return el.lessonBtns.filter(function (b) { return b.dataset.lessonBtn === id; })[0];
    }

    /* --- chat: Leo ---------------------------------------------------- */

    function scrollChat() {
      el.chatlog.scrollTop = el.chatlog.scrollHeight;
    }

    function appendLeo(text) {
      var msg = document.createElement('div');
      msg.className = 'l-msg l-msg-leo';
      msg.appendChild(avaTpl.cloneNode(true));
      var bubble = document.createElement('div');
      bubble.className = 'l-bubble l-bubble-leo';
      var p = document.createElement('p');
      p.textContent = text;
      bubble.appendChild(p);
      msg.appendChild(bubble);
      el.chatlog.appendChild(msg);
      scrollChat();
    }

    function appendUser(text) {
      var msg = document.createElement('div');
      msg.className = 'l-msg l-msg-user';
      var bubble = document.createElement('div');
      bubble.className = 'l-bubble l-bubble-user';
      bubble.textContent = text;
      msg.appendChild(bubble);
      el.chatlog.appendChild(msg);
      scrollChat();
    }

    function showTyping() {
      if (typingEl) return;
      typingEl = document.createElement('div');
      typingEl.className = 'l-msg l-msg-leo';
      typingEl.appendChild(avaTpl.cloneNode(true));
      var bubble = document.createElement('div');
      bubble.className = 'l-bubble l-bubble-leo l-typing';
      bubble.appendChild(document.createElement('span'));
      bubble.appendChild(document.createElement('span'));
      bubble.appendChild(document.createElement('span'));
      typingEl.appendChild(bubble);
      el.chatlog.appendChild(typingEl);
      scrollChat();
    }

    function markUnread() {
      if (root.dataset.right === 'closed' && el.unread) el.unread.hidden = false;
    }

    function leoSay(text, key) {
      if (key && state.lastMsgKey === key) return;
      state.lastMsgKey = key || null;
      markUnread();
      if (REDUCED) {
        appendLeo(text);
        return;
      }
      showTyping();
      uiTimers.after(1000, function () {
        if (typingEl) {
          typingEl.remove();
          typingEl = null;
        }
        appendLeo(text);
      });
    }

    /* --- progress ------------------------------------------------------ */

    function setPoints(target, animate) {
      if (!animate) {
        state.points = target;
        el.points.textContent = String(target);
        return;
      }
      var pill = el.points.parentElement;
      pill.classList.remove('is-bump');
      void pill.offsetWidth;
      pill.classList.add('is-bump');
      var h = uiTimers.every(40, function () {
        state.points = Math.min(target, state.points + 5);
        el.points.textContent = String(state.points);
        if (state.points >= target) uiTimers.kill(h);
      });
    }

    var totalLessons = Number(el.progressText.dataset.total) || el.lessonBtns.length;

    function updateProgress() {
      var n = Object.keys(state.completed).length;
      el.progressFill.style.width = (n / totalLessons) * 100 + '%';
      el.progressFill.classList.toggle('is-green', n === totalLessons);
      el.progressText.textContent = n + '/' + totalLessons + ' ' + unit;
    }

    function complete(id) {
      if (state.completed[id]) return;
      state.completed[id] = true;
      var btn = lessonBtn(id);
      btn.classList.add('is-done');
      btn.querySelector('.l-tickico').hidden = false;
      updateProgress();
      var key = { intro: 'afterVideo', quiz: 'afterQuiz', fix: 'afterFix' }[id];
      if (key && msgs[key]) leoSay(msgs[key], key);
    }

    /* --- navigation ----------------------------------------------------- */

    function selectLesson(id, fromUser) {
      var btn = lessonBtn(id);
      if (!btn) return;
      state.current = id;
      root.dataset.lesson = id;
      el.lessonBtns.forEach(function (b) {
        b.classList.toggle('is-current', b === btn);
      });
      el.stageTitle.textContent = btn.querySelector('.l-lesson-title').textContent;
      el.stageMeta.textContent = btn.querySelector('.l-lesson-meta').textContent;
      var type = btn.dataset.type;
      el.viewVideo.hidden = type !== 'video';
      el.viewQuiz.hidden = type !== 'quiz';
      el.viewHands.hidden = type !== 'handson';
      if (type === 'video') {
        setupVideo(id);
      } else {
        vidTimers.clear();
        tutorTalking(false);
      }
      if (fromUser) root.dataset.mpane = 'learn';
    }

    /* --- video lessons (slide + Leo teaching) ---------------------------- */

    function tutorTalking(on) {
      el.tutor.classList.toggle('is-talking', on);
    }

    function setPlayPressed(on) {
      el.vplay.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    function setCaption(text) {
      vid.lastNarration = text || '';
      el.caption.textContent = vid.lastNarration;
      el.caption.hidden = !state.captionsOn || !vid.lastNarration;
    }

    function showAllBullets() {
      vid.bullets.forEach(function (b) { b.classList.add('is-on'); });
      vid.idx = vid.bullets.length;
      var last = vid.bullets[vid.bullets.length - 1];
      setCaption(last ? last.dataset.narration : '');
    }

    function playStep() {
      if (!vid.playing || !visible) return;
      var b = vid.bullets[vid.idx];
      if (!b) return;
      b.classList.add('is-on');
      setCaption(b.dataset.narration);
      vid.idx += 1;
      el.vfill.style.width = Math.round((vid.idx / vid.bullets.length) * 100) + '%';
      if (vid.idx >= vid.bullets.length) {
        vidTimers.after(900, finishVideo);
      } else {
        vidTimers.after(2300, playStep);
      }
    }

    function finishVideo() {
      tutorTalking(false);
      setPlayPressed(false);
      vid.playing = false;
      var isFresh = !state.completed[state.current];
      complete(state.current);
      var next = NEXT[state.current];
      if (isFresh && next) {
        vidTimers.after(REDUCED ? 0 : 1400, function () { selectLesson(next, true); });
      }
    }

    function setupVideo(id) {
      vidTimers.clear();
      vid.setEl = $('[data-slide-for="' + id + '"]');
      el.slidesets.forEach(function (s) { s.hidden = s !== vid.setEl; });
      el.vdur.textContent = vid.setEl.dataset.dur;
      vid.bullets = Array.prototype.slice.call(vid.setEl.querySelectorAll('.l-bullet'));
      vid.idx = 0;
      tutorTalking(false);
      if (state.completed[id] || REDUCED) {
        showAllBullets();
        el.vfill.style.width = '100%';
        setPlayPressed(false);
        vid.playing = false;
      } else {
        vid.bullets.forEach(function (b) { b.classList.remove('is-on'); });
        el.vfill.style.width = '0%';
        setCaption('');
        setPlayPressed(true);
        vid.playing = true;
        if (visible) {
          tutorTalking(true);
          vidTimers.after(600, playStep);
        }
      }
    }

    el.vplay.addEventListener('click', function () {
      if (REDUCED) return;
      if (vid.playing) {
        vid.playing = false;
        vidTimers.clear();
        tutorTalking(false);
        setPlayPressed(false);
        return;
      }
      if (vid.idx >= vid.bullets.length) {
        vid.idx = 0;
        vid.bullets.forEach(function (b) { b.classList.remove('is-on'); });
        el.vfill.style.width = '0%';
        setCaption('');
      }
      vid.playing = true;
      setPlayPressed(true);
      tutorTalking(true);
      if (visible) vidTimers.after(300, playStep);
    });

    el.captionToggle.addEventListener('click', function () {
      state.captionsOn = !state.captionsOn;
      el.captionToggle.setAttribute('aria-pressed', state.captionsOn ? 'true' : 'false');
      el.caption.hidden = !state.captionsOn || !vid.lastNarration;
    });

    /* --- quiz ------------------------------------------------------------ */

    function chipFor(value) {
      return el.chips.filter(function (chip) { return chip.dataset.chip === value; })[0];
    }

    function firstEmptyBlank() {
      return el.blanks.filter(function (blank) { return !blank.dataset.value; })[0];
    }

    function placeChip(chip) {
      var blank = firstEmptyBlank();
      if (!blank || chip.classList.contains('is-used')) return;
      blank.dataset.value = chip.dataset.chip;
      blank.textContent = chip.dataset.chip;
      blank.classList.add('is-filled');
      chip.classList.add('is-used');
      el.answer.disabled = !!firstEmptyBlank();
    }

    function clearBlank(blank) {
      if (!blank.dataset.value || blank.classList.contains('is-correct')) return;
      if (state.graded && !blank.classList.contains('is-wrong')) return;
      var chip = chipFor(blank.dataset.value);
      if (chip) chip.classList.remove('is-used', 'is-wrong');
      delete blank.dataset.value;
      blank.textContent = '';
      blank.classList.remove('is-filled', 'is-wrong');
      state.graded = false;
      el.answer.disabled = true;
    }

    el.chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (state.graded) return;
        placeChip(chip);
      });
    });

    el.blanks.forEach(function (blank) {
      blank.addEventListener('click', function () { clearBlank(blank); });
    });

    el.answer.addEventListener('click', function () {
      if (el.answer.dataset.mode === 'continue') {
        selectLesson('fix', true);
        return;
      }
      if (el.answer.disabled || state.graded) return;
      state.graded = true;
      var allCorrect = true;
      el.blanks.forEach(function (blank) {
        var ok = blank.dataset.value === blank.dataset.answer;
        if (ok) {
          blank.classList.add('is-correct');
        } else {
          allCorrect = false;
          blank.classList.add('is-wrong');
          var chip = chipFor(blank.dataset.value);
          if (chip) chip.classList.add('is-wrong');
        }
      });
      if (allCorrect) {
        setPoints(state.points + 50, !REDUCED);
        el.toast.hidden = false;
        el.answer.dataset.mode = 'continue';
        el.answer.textContent = el.answer.dataset.continue;
        complete('quiz');
      } else {
        el.answer.disabled = true;
      }
    });

    /* --- hands-on editor (type your own fix) ------------------------------ */

    function norm(s) {
      return s.replace(/\s+/g, ' ').replace(/\s+;/g, ';').trim();
    }

    function setStat(line, ok) {
      var stat = line.querySelector('.l-linestat');
      stat.textContent = ok ? '✓' : '✕';
      stat.classList.toggle('is-ok', ok);
      stat.classList.toggle('is-bad', !ok);
    }

    function flashLineMsg(ok) {
      el.linemsg.hidden = false;
      el.linemsg.textContent = ok ? el.linemsg.dataset.ok : el.linemsg.dataset.bad;
      el.linemsg.classList.toggle('is-ok', ok);
      el.linemsg.classList.toggle('is-bad', !ok);
    }

    function userEl(line, create) {
      var span = line.querySelector('.l-usertext');
      if (!span && create) {
        span = document.createElement('span');
        span.className = 'l-usertext';
        line.querySelector('.l-linebody').appendChild(span);
      }
      return span;
    }

    function renderLine(line) {
      var body = line.querySelector('.l-linebody');
      body.classList.toggle('has-user', !!line.dataset.userText);
      var span = userEl(line, false);
      if (line.dataset.userText) {
        span = userEl(line, true);
        span.textContent = line.dataset.userText;
      } else if (span) {
        span.remove();
      }
    }

    function startEdit(line) {
      if (line.classList.contains('is-fixed')) return;
      if (editing) commitEdit();
      var body = line.querySelector('.l-linebody');
      var current = line.dataset.userText || line.querySelector('.l-broken').textContent;
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'l-editline';
      input.value = current;
      input.setAttribute('aria-label', 'Program.cs:' + (Number(line.dataset.codeLine) + 1));
      input.spellcheck = false;
      body.classList.add('is-editing');
      body.appendChild(input);
      editing = { line: line, input: input };
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitEdit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
        }
      });
      input.addEventListener('blur', function () {
        if (editing && editing.input === input) commitEdit();
      });
    }

    function teardownEdit() {
      var ed = editing;
      editing = null;
      ed.input.remove();
      ed.line.querySelector('.l-linebody').classList.remove('is-editing');
      return ed;
    }

    function cancelEdit() {
      var ed = teardownEdit();
      renderLine(ed.line);
    }

    function commitEdit() {
      var ed = teardownEdit();
      var line = ed.line;
      var val = ed.input.value;
      var v = norm(val);
      var expected = norm(line.querySelector('.l-fixed').textContent);
      var broken = norm(line.querySelector('.l-broken').textContent);
      if (v === expected) {
        delete line.dataset.userText;
        renderLine(line);
        line.classList.add('is-fixed');
        line.classList.remove('has-err');
        setStat(line, true);
        flashLineMsg(true);
      } else if (!v || v === broken) {
        renderLine(line);
      } else {
        line.dataset.userText = val;
        renderLine(line);
        line.classList.remove('is-wrong');
        void line.offsetWidth;
        line.classList.add('is-wrong');
        setStat(line, false);
        flashLineMsg(false);
      }
    }

    el.fixLines.forEach(function (line) {
      line.addEventListener('click', function () {
        if (editing && editing.line === line) return;
        startEdit(line);
      });
      line.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && !editing) {
          e.preventDefault();
          startEdit(line);
        }
      });
    });

    el.submit.addEventListener('click', function () {
      if (editing) commitEdit();
      el.checks.hidden = false;
      var allPass = true;
      el.checkItems.forEach(function (item, i) {
        var line = el.fixLines[i];
        var pass = !!line && line.classList.contains('is-fixed');
        if (!pass) allPass = false;
        item.classList.toggle('is-pass', pass);
        item.classList.toggle('is-fail', !pass);
        item.querySelector('.l-check-icon').textContent = pass ? '✓' : '✕';
      });
      el.result.hidden = false;
      el.result.textContent = allPass ? el.result.dataset.ok : el.result.dataset.fail;
      el.result.classList.toggle('is-ok', allPass);
      el.result.classList.toggle('is-fail', !allPass);
      if (allPass && !state.completed.fix) {
        setPoints(state.points + 50, !REDUCED);
        complete('fix');
      }
    });

    /* --- panes, chat chips, outline ---------------------------------------- */

    el.lessonBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectLesson(btn.dataset.lessonBtn, true);
      });
    });

    el.sqs.forEach(function (chip) {
      chip.addEventListener('click', function () {
        appendUser(chip.dataset.q);
        chip.hidden = true;
        state.lastMsgKey = null;
        leoSay(chip.dataset.a);
      });
    });

    el.toggleLeft.addEventListener('click', function () {
      root.dataset.left = root.dataset.left === 'open' ? 'closed' : 'open';
    });

    el.toggleRight.addEventListener('click', function () {
      var opening = root.dataset.right !== 'open';
      root.dataset.right = opening ? 'open' : 'closed';
      if (opening && el.unread) el.unread.hidden = true;
    });

    $$('[data-mnav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.dataset.mpane = btn.dataset.mnav;
        if (btn.dataset.mnav === 'chat' && el.unread) el.unread.hidden = true;
      });
    });

    /* --- visibility gating -------------------------------------------------- */

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (visible) return;
            visible = true;
            var btn = lessonBtn(state.current);
            if (btn && btn.dataset.type === 'video' && vid.playing && !REDUCED && vid.idx < vid.bullets.length) {
              tutorTalking(true);
              vidTimers.after(400, playStep);
            }
          } else if (visible) {
            visible = false;
            vidTimers.clear();
            tutorTalking(false);
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el.frame);

    selectLesson('intro', false);
  }

  /* ------------------------------------------------------------------ *
   * Simulation 02 — Meeting (free exploration, same model as Learning:
   * nothing plays on its own, every state change is a direct response to
   * a click)
   * ------------------------------------------------------------------ */

  function initMeeting(root) {
    function $(sel) { return root.querySelector(sel); }
    function $$(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

    var el = {
      frame: $('.sim-frame'),
      join: $('[data-m="join"]'),
      endCall: $('[data-m="end-call"]'),
      lobbyCam: $('[data-m="cam"]'),
      lobbyMic: $('[data-m="mic"]'),
      grid: $('[data-m="grid"]'),
      tiles: $$('.m-tile'),
      caption: $('[data-m="caption"]'),
      capSpeaker: $('.m-cap-speaker'),
      capMarker: $('.m-cap-marker'),
      capText: $('.m-cap-text'),
      rail: $('.m-rail'),
      tabs: $$('.m-tab'),
      panels: $$('.m-panel'),
      chatInput: $('[data-m="chat-input"]'),
      summarize: $('[data-m="summarize"]'),
      sumwrap: $('[data-m="sumwrap"]'),
      sums: $$('li[data-sum]'),
      note: $('[data-m="note"]'),
      timer: $('[data-m="timer"]'),
      translate: $('[data-m="translate"]'),
      roomMic: $('[data-m="room-mic"]'),
      roomCam: $('[data-m="room-cam"]'),
      lines: $$('[data-mline]'),
    };

    var sumTexts = el.sums.map(function (li) { return li.querySelector('.m-sum-text').textContent; });
    var capTimers = createTimers();
    var sumTimers = createTimers();
    var secs = 0;
    var timerH = null;
    var summarized = false;
    var captionsOn = false;
    var capIdx = 0;
    var visible = false;

    function fmt(total) {
      var m = Math.floor(total / 60);
      var s = total % 60;
      return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    }

    function startTimer() {
      if (timerH) return;
      timerH = setInterval(function () {
        secs += 1;
        el.timer.textContent = fmt(secs);
      }, 1000);
    }

    function stopTimer() {
      if (timerH) clearInterval(timerH);
      timerH = null;
      secs = 0;
      el.timer.textContent = fmt(0);
    }

    function setRTab(name) {
      el.tabs.forEach(function (tab) {
        tab.classList.toggle('is-active', tab.dataset.mtab === name);
      });
      el.panels.forEach(function (panel) {
        panel.hidden = panel.dataset.panel !== name;
      });
      el.chatInput.hidden = name !== 'chat';
      root.dataset.tab = name;
    }

    function openTab(name) {
      if (root.dataset.rail === 'open' && root.dataset.tab === name) {
        root.dataset.rail = 'closed';
        return;
      }
      root.dataset.rail = 'open';
      setRTab(name);
    }

    function showLine(j) {
      var line = el.lines[j];
      if (!line) return;
      el.capSpeaker.textContent = line.dataset.speaker;
      el.capText.textContent = line.textContent;
      var from = (line.dataset.from || '').toUpperCase();
      if (from && from.toLowerCase() !== LOCALE) {
        el.capMarker.textContent = from + ' → ' + LOCALE.toUpperCase();
        el.capMarker.hidden = false;
      } else {
        el.capMarker.hidden = true;
      }
      el.caption.hidden = false;
      el.caption.classList.remove('m-cap-in');
      void el.caption.offsetWidth;
      el.caption.classList.add('m-cap-in');
      var tileIdx = Number(line.dataset.tile);
      el.tiles.forEach(function (tile, i) { tile.classList.toggle('is-speaking', i === tileIdx); });
    }

    // Live captions stream in on their own once translate is switched on —
    // that's the feature being demoed, not a scripted intro. Turning
    // translate off (or leaving the call) stops the stream.
    function stepCaptions() {
      if (!captionsOn || !visible) return;
      showLine(capIdx);
      capIdx = (capIdx + 1) % el.lines.length;
      capTimers.after(3400, stepCaptions);
    }

    function startCaptions() {
      if (!el.lines.length) return;
      captionsOn = true;
      if (REDUCED) {
        showLine(el.lines.length - 1);
        return;
      }
      capIdx = 0;
      if (visible) stepCaptions();
    }

    function stopCaptions() {
      captionsOn = false;
      capTimers.clear();
      el.caption.hidden = true;
      el.capMarker.hidden = true;
      el.tiles.forEach(function (tile) { tile.classList.remove('is-speaking'); });
    }

    function translateOn() {
      return el.translate.getAttribute('aria-pressed') === 'true';
    }

    function doSummary() {
      if (summarized) return;
      summarized = true;
      el.summarize.disabled = true;
      el.sumwrap.hidden = false;
      if (REDUCED) {
        el.sums.forEach(function (li, i) {
          li.hidden = false;
          li.querySelector('.m-sum-text').textContent = sumTexts[i];
        });
        el.note.hidden = false;
        return;
      }
      var next = function (i) {
        if (i >= el.sums.length) {
          sumTimers.after(400, function () { el.note.hidden = false; });
          return;
        }
        var li = el.sums[i];
        li.hidden = false;
        typeText(li.querySelector('.m-sum-text'), sumTexts[i], sumTimers, function () {
          sumTimers.after(250, function () { next(i + 1); });
        });
      };
      next(0);
    }

    function joinRoom() {
      root.dataset.surface = 'room';
      el.tiles.forEach(function (tile) { tile.classList.add('is-on'); });
      el.grid.dataset.count = '4';
      el.grid.classList.add('has-all');
      startTimer();
    }

    function leaveRoom() {
      root.dataset.surface = 'lobby';
      root.dataset.rail = 'closed';
      setRTab('chat');

      stopCaptions();
      stopTimer();
      sumTimers.clear();

      el.tiles.forEach(function (tile) { tile.classList.remove('is-on', 'is-speaking'); });
      el.grid.dataset.count = '1';
      el.grid.classList.remove('has-all');

      summarized = false;
      el.summarize.disabled = false;
      el.sumwrap.hidden = true;
      el.sums.forEach(function (li, i) {
        li.hidden = true;
        li.querySelector('.m-sum-text').textContent = sumTexts[i];
      });
      el.note.hidden = true;

      el.translate.setAttribute('aria-pressed', 'false');
      el.roomMic.setAttribute('aria-pressed', 'true');
      el.roomCam.setAttribute('aria-pressed', 'false');
    }

    /* interactions -------------------------------------------------------- */

    el.join.addEventListener('click', joinRoom);
    el.endCall.addEventListener('click', leaveRoom);

    [el.lobbyCam, el.lobbyMic, el.roomMic, el.roomCam].forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', on ? 'false' : 'true');
      });
    });

    el.translate.addEventListener('click', function () {
      var on = !translateOn();
      el.translate.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) startCaptions();
      else stopCaptions();
    });

    el.tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { setRTab(tab.dataset.mtab); });
    });

    $$('[data-open-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { openTab(btn.dataset.openTab); });
    });

    el.summarize.addEventListener('click', doSummary);

    // Mobile: the rail is a bottom-sheet overlay there — tapping the meeting
    // screen behind it closes it, same as any other overlay panel.
    el.frame.addEventListener('click', function (e) {
      if (root.dataset.rail !== 'open') return;
      if (window.innerWidth >= 640) return;
      if (e.target.closest('.m-rail') || e.target.closest('[data-open-tab]')) return;
      root.dataset.rail = 'closed';
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (visible) return;
            visible = true;
            if (captionsOn && !REDUCED) capTimers.after(300, stepCaptions);
          } else if (visible) {
            visible = false;
            capTimers.clear();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el.frame);
  }

  /* ------------------------------------------------------------------ *
   * Simulation 03 — Haloki (free exploration)
   *
   * One state object. Every figure on every screen is recomputed from it.
   * Money is held in integer cents so the arithmetic is exact. No network,
   * no storage: a reload returns the simulation to its idle state.
   * ------------------------------------------------------------------ */

  function initHaloki(root) {
    function $(sel) { return root.querySelector(sel); }
    function $$(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
    function byH(name) { return root.querySelector('[data-h="' + name + '"]'); }

    var d = root.dataset;
    var CFG = {
      minTransfer: Math.round(Number(d.minTransfer) * 100),
      maxTransfer: Math.round(Number(d.maxTransfer) * 100),
      minSend: Math.round(Number(d.minSend) * 100),
      achFee: Math.round(Number(d.achFee) * 100),
      hkFeePct: Number(d.hkFeePct),
      hkFeeCap: Math.round(Number(d.hkFeeCap) * 100),
      balanceMs: Number(d.balMs),
      fx: Number(d.fx),
      settleDays: Number(d.settleDays),
      lockSecs: Number(d.lockSecs),
    };

    /* How long the funding row sits at Pending before the wallet credit
       resolves to Completed. The ACH leg is still days out: that fact
       lives on the transaction detail, not on the row. */
    var FUND_PENDING_MS = 3000;
    var PAYOUT_MS = 1500;
    var TOAST_MS = 2500;

    var S = byH('strings').dataset;

    var el = {
      frame: $('.sim-frame'),
      title: byH('title'),
      back: byH('back'),
      screens: $$('.hk-screen'),
      balance: byH('balance'),
      acctChip: byH('acct-chip'),
      acctChipText: $('.h-acctchip-text'),
      acctList: byH('acct-list'),
      actTransfer: byH('act-transfer'),
      actSend: byH('act-send'),
      activity: byH('activity'),
      activityEmpty: byH('activity-empty'),
      from: byH('from'),
      balRow: byH('bal-row'),
      balSpin: byH('bal-spin'),
      balText: byH('bal-text'),
      tAmount: byH('transfer-amount'),
      tErr: byH('transfer-err'),
      tFee: byH('transfer-fee'),
      tCredited: byH('transfer-credited'),
      addMoney: byH('add-money'),
      sAmount: byH('send-amount'),
      sErr: byH('send-err'),
      purpose: byH('purpose'),
      qSend: byH('q-send'),
      qRate: byH('q-rate'),
      qGets: byH('q-gets'),
      sendContinue: byH('send-continue'),
      rcpContinue: byH('rcp-continue'),
      rvName: byH('rv-name'),
      rvBank: byH('rv-bank'),
      rvSend: byH('rv-send'),
      rvRate: byH('rv-rate'),
      rvPurpose: byH('rv-purpose'),
      rvGets: byH('rv-gets'),
      lock: byH('lock'),
      confirm: byH('confirm'),
      stFund: $('[data-hstatus="fund"]'),
      stSend: $('[data-hstatus="send"]'),
      stFHead: byH('st-f-head'),
      stFFrom: byH('st-f-from'),
      stFFee: byH('st-f-fee'),
      stFCredited: byH('st-f-credited'),
      stSHead: byH('st-s-head'),
      stSTo: byH('st-s-to'),
      stSGot: byH('st-s-got'),
      stSRate: byH('st-s-rate'),
      stSPurpose: byH('st-s-purpose'),
      stSPaid: byH('st-s-paid'),
      stSPaidTime: byH('st-s-paid-time'),
      stSNotice: byH('st-s-notice'),
      stSNoticeText: byH('st-s-notice-text'),
      plaidLayer: $('[data-hlayer="plaid"]'),
      plaidStep1: $('[data-hplaid="1"]'),
      plaidStep2: $('[data-hplaid="2"]'),
      plaidBank: byH('plaid-bank'),
      plaidAcct: byH('plaid-acct'),
      plaidConnect: byH('plaid-connect'),
      usBanks: $$('[data-h-usbank]'),
      modalLayer: $('[data-hlayer="modal"]'),
      modalTitle: byH('modal-title'),
      modalBody: byH('modal-body'),
      modalBtn: byH('modal-btn'),
      feeLayer: $('[data-hlayer="fee"]'),
      feeInfo: byH('fee-info'),
      feeTotal: byH('fee-total'),
      feeHaloki: byH('fee-haloki'),
      feeAch: byH('fee-ach'),
      toast: byH('toast'),
      toastText: byH('toast-text'),
      flow: root.querySelector('.h-flow'),
      flowNote: byH('flow-note'),
    };

    var lockTimers = createTimers();
    var payTimers = createTimers();
    var fundTimers = createTimers();
    var toastTimers = createTimers();
    var balTimers = createTimers();
    var visible = false;
    var pendingPayout = false;
    var pendingFunding = false;
    var pendingBalance = false;

    var pendingToast = false;

    /* Recipient first, then amount and purpose, then review. */
    var BACK = {
      accounts: 'home',
      transfer: 'home',
      sendRecipient: 'home',
      sendAmount: 'sendRecipient',
      sendReview: 'sendAmount',
      status: 'home',
    };

    var state = {
      screen: 'home',
      linked: [],
      fromId: null,
      balance: 0,
      txns: [],
      statusTxn: null,
      plaidPick: null,
      lockLeft: CFG.lockSecs,
      // True once the Plaid balance check for the selected account has
      // resolved. Reset every time the check restarts.
      balShown: false,
    };

    /* --- money formatting and arithmetic ------------------------------- */

    function group(n) {
      var s = String(n);
      var out = '';
      var count = 0;
      var i;
      for (i = s.length - 1; i >= 0; i -= 1) {
        out = s.charAt(i) + out;
        count += 1;
        if (count % 3 === 0 && i > 0) out = ',' + out;
      }
      return out;
    }

    function usd(cents) {
      var v = Math.abs(cents);
      var frac = v % 100;
      return (cents < 0 ? '-$' : '$') + group(Math.floor(v / 100)) + '.' + (frac < 10 ? '0' + frac : String(frac));
    }

    // Vietnamese groups thousands with dots, English with commas.
    function vndDots(amount) { return group(amount).split(',').join('.') + ' ₫'; }

    function vnd(amount) { return LOCALE === 'vi' ? vndDots(amount) : group(amount) + ' ₫'; }

    function fill(tpl, key, value) { return String(tpl).split('{' + key + '}').join(value); }

    /* Amount fields take digits and at most one decimal point. Anything
       else a keyboard or a paste produces is dropped as it is typed. */
    function cleanAmount(raw) {
      var s = String(raw || '').replace(/[^0-9.]/g, '');
      var dot = s.indexOf('.');
      if (dot === -1) return s;
      return s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
    }

    function sanitizeInput(input) {
      var cleaned = cleanAmount(input.value);
      if (input.value !== cleaned) input.value = cleaned;
    }

    function parseCents(raw) {
      var cleaned = String(raw || '').replace(/[^0-9.]/g, '');
      if (!cleaned) return null;
      var value = parseFloat(cleaned);
      if (isNaN(value)) return null;
      return Math.round(value * 100);
    }

    /* The funding fee is two components. ACH is a flat network cost that
       does not scale with the amount; the Haloki component is a percentage
       with its own cap. The screens show the sum, and the sum is what the
       ledger uses. Both caps together bound the total at $5.00, so there
       is no separate combined cap. */
    function halokiFee(cents) { return Math.min(Math.round(cents * CFG.hkFeePct), CFG.hkFeeCap); }

    // Nothing entered means nothing is being transferred, so no fee applies.
    // Without this the flat ACH component would show a fee against an empty
    // field and credit a negative amount.
    function transferFee(cents) { return cents > 0 ? CFG.achFee + halokiFee(cents) : 0; }

    function toVnd(cents) { return Math.round((cents * CFG.fx) / 100); }

    function rateText() { return '1 USD = ' + vnd(CFG.fx); }

    function fmtClock(total) {
      var m = Math.floor(total / 60);
      var s = total % 60;
      return (m < 10 ? '0' + m : String(m)) + ':' + (s < 10 ? '0' + s : String(s));
    }

    /* --- navigation ----------------------------------------------------- */

    function screenEl(name) {
      return el.screens.filter(function (s) { return s.dataset.hscreen === name; })[0];
    }

    function go(name) {
      state.screen = name;
      root.dataset.screen = name;
      el.screens.forEach(function (s) { s.classList.toggle('is-active', s.dataset.hscreen === name); });
      el.title.textContent = screenEl(name).dataset.title;
      if (name === 'transfer') { fillFromSelect(); startBalanceCheck(); } else { stopBalanceCheck(); }
      if (name === 'sendAmount') renderQuote();
      if (name === 'sendReview') { renderReview(); startLock(); } else { stopLock(); }
      if (name === 'accounts') renderAccounts();
    }

    /* --- overlays -------------------------------------------------------- */

    function openPlaid() {
      state.plaidPick = null;
      el.usBanks.forEach(function (b) { b.classList.remove('is-sel'); });
      el.plaidStep1.hidden = false;
      el.plaidStep2.hidden = true;
      el.plaidLayer.classList.add('is-open');
    }

    function closePlaid() { el.plaidLayer.classList.remove('is-open'); }

    function openModal(kind) {
      var ds = el.modalLayer.dataset;
      if (kind === 'link') {
        el.modalTitle.textContent = ds.linkTitle;
        el.modalBody.textContent = ds.linkBody;
        el.modalBtn.textContent = ds.linkBtn;
      } else {
        el.modalTitle.textContent = ds.balTitle;
        el.modalBody.textContent = fill(fill(ds.balBody, 'balance', usd(state.balance)), 'min', usd(CFG.minSend));
        el.modalBtn.textContent = ds.balBtn;
      }
      el.modalLayer.dataset.kind = kind;
      el.modalLayer.classList.add('is-open');
    }

    function closeModal() { el.modalLayer.classList.remove('is-open'); }

    /* --- toast, inside the frame ------------------------------------------ */

    function hideToast() {
      pendingToast = false;
      el.toast.hidden = true;
    }

    function showToast(text) {
      toastTimers.clear();
      el.toastText.textContent = text;
      el.toast.hidden = false;
      pendingToast = true;
      // Auto-dismisses under reduced motion too. Only the fade is dropped
      // there, by the reduced-motion rule in the stylesheet.
      toastTimers.after(TOAST_MS, hideToast);
    }

    /* --- home ------------------------------------------------------------- */

    function activeAccount() {
      return state.linked.filter(function (a) { return a.id === state.fromId; })[0] || state.linked[0] || null;
    }

    function accountLabel(acct) { return acct.name + ' ••••' + acct.mask; }

    function makeActivityRow(tx) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'h-act-row';
      btn.dataset.hTx = tx.id;

      var ico = document.createElement('span');
      ico.className = 'h-act-ico';
      ico.textContent = tx.kind === 'fund' ? '↓' : '↑';
      btn.appendChild(ico);

      var main = document.createElement('span');
      main.className = 'h-act-main';
      var title = document.createElement('span');
      title.className = 'h-act-title';
      title.textContent = tx.kind === 'fund' ? S.addedRow : fill(S.sentRow, 'name', tx.rcpName);
      main.appendChild(title);

      var sub = document.createElement('span');
      sub.className = 'h-act-sub';
      if (tx.kind === 'fund' && tx.status === 'pending') {
        // A spinner rides the Pending chip until the wallet credit clears.
        var spin = document.createElement('span');
        spin.className = 'h-spin';
        spin.setAttribute('aria-hidden', 'true');
        sub.appendChild(spin);
      }
      var chip = document.createElement('span');
      chip.className = 'h-chip is-' + tx.status;
      if (tx.status === 'done') chip.textContent = S.completed;
      else if (tx.status === 'pending') chip.textContent = S.pending;
      else chip.textContent = S.sending;
      sub.appendChild(chip);
      if (tx.kind === 'fund' && tx.status === 'pending') {
        sub.appendChild(document.createTextNode(' · ' + fill(S.settlesIn, 'days', CFG.settleDays)));
      }
      main.appendChild(sub);
      btn.appendChild(main);

      var amt = document.createElement('span');
      amt.className = 'h-act-amt';
      amt.textContent = usd(tx.amount);
      btn.appendChild(amt);

      btn.addEventListener('click', function () { openStatus(tx); });
      li.appendChild(btn);
      return li;
    }

    function renderHome() {
      el.balance.textContent = usd(state.balance);

      var acct = activeAccount();
      el.acctChip.hidden = !acct;
      if (acct) el.acctChipText.textContent = accountLabel(acct);

      // Transfer Money never renders locked: it is the entry point, and with no
      // bank linked, tapping it opens the modal that links one. A home screen
      // where every action is greyed out reads as a dead frame nobody bothers
      // to click. Send Money stays muted until it is genuinely usable.
      var canTransfer = state.linked.length > 0;
      var canSend = canTransfer && state.balance >= CFG.minSend;
      el.actSend.classList.toggle('is-locked', !canSend);

      el.activity.textContent = '';
      state.txns.forEach(function (tx) { el.activity.appendChild(makeActivityRow(tx)); });
      el.activityEmpty.hidden = state.txns.length > 0;
    }

    function renderAccounts() {
      el.acctList.textContent = '';
      state.linked.forEach(function (acct) {
        var li = document.createElement('li');
        var row = document.createElement('div');
        row.className = 'h-rcp';
        var text = document.createElement('span');
        var name = document.createElement('span');
        name.className = 'h-rcp-name';
        name.textContent = acct.name;
        var meta = document.createElement('span');
        meta.className = 'h-rcp-meta';
        meta.textContent = acct.subtype + ' ••••' + acct.mask;
        text.appendChild(name);
        text.appendChild(meta);
        row.appendChild(text);
        li.appendChild(row);
        el.acctList.appendChild(li);
      });
    }

    /* --- money-flow rail ------------------------------------------------- *
     * A second reading of the same state object: not what the screens show,
     * but where the money physically is. It is the only view in which the
     * two legs are visible at once — the VND payout settled while the ACH
     * debit is still days out — which is the whole point of the design.    */

    function setFlowNode(key, fstate, value, meta) {
      var node = root.querySelector('[data-hflow="' + key + '"]');
      if (!node) return;
      node.dataset.fstate = fstate;
      node.querySelector('[data-hflow-value="' + key + '"]').textContent = value;
      node.querySelector('[data-hflow-meta="' + key + '"]').textContent = meta || '';
    }

    function txnsOfKind(kind) {
      return state.txns.filter(function (tx) { return tx.kind === kind; });
    }

    function sumBy(list, prop) {
      return list.reduce(function (total, tx) { return total + tx[prop]; }, 0);
    }

    function renderFlow() {
      if (!el.flow) return;

      var acct = activeAccount();
      var funds = txnsOfKind('fund');
      var sends = txnsOfKind('send');
      var paid = sends.filter(function (tx) { return tx.status === 'done'; });
      var achDays = fill(S.flowAchMeta, 'days', CFG.settleDays);

      setFlowNode(
        'bank',
        acct ? 'done' : 'idle',
        acct ? accountLabel(acct) : S.flowBankIdle,
        acct ? S.flowBankMeta : ''
      );

      /* Every debit raised in this session is still in flight: the sim never
         runs long enough for a T+3 leg to settle, and pretending otherwise
         would undo the point the rail exists to make. */
      setFlowNode(
        'ach',
        funds.length ? 'live' : 'idle',
        funds.length ? usd(sumBy(funds, 'amount')) : S.flowAchIdle,
        funds.length ? achDays : ''
      );

      var funding = funds.some(function (tx) { return tx.status === 'pending'; });
      setFlowNode(
        'wallet',
        funds.length ? (funding ? 'live' : 'done') : 'idle',
        funds.length ? usd(state.balance) : S.flowWalletIdle,
        funds.length ? S.flowWalletMeta : ''
      );

      var sending = sends.some(function (tx) { return tx.status === 'sending'; });
      setFlowNode(
        'payout',
        sends.length ? (sending ? 'live' : 'done') : 'idle',
        sends.length ? vnd(sumBy(sends, 'vnd')) : S.flowPayoutIdle,
        sends.length ? (sending ? S.flowPayoutMetaSending : S.flowPayoutMeta) : ''
      );

      /* The punchline only lands once both are true at the same moment. */
      var settling = paid.length > 0 && funds.length > 0;
      el.flow.dataset.fnote = settling ? 'settling' : 'idle';
      el.flowNote.textContent = settling
        ? fill(S.flowNoteSettling, 'days', CFG.settleDays)
        : S.flowNoteIdle;
    }

    function renderAll() {
      renderHome();
      renderAccounts();
      renderFlow();
      if (state.screen === 'transfer') renderTransfer();
      if (state.screen === 'sendAmount') renderQuote();
      if (state.screen === 'status' && state.statusTxn) renderStatus(state.statusTxn);
    }

    /* --- Plaid ------------------------------------------------------------- */

    function linkAccount(btn) {
      var id = btn.dataset.hUsbank;
      var already = state.linked.filter(function (a) { return a.id === id; })[0];
      if (!already) {
        state.linked.push({
          id: id,
          name: btn.dataset.name,
          mask: btn.dataset.mask,
          subtype: btn.dataset.subtype,
          // What the Plaid balance check reports for this account.
          avail: Math.round(Number(btn.dataset.available) * 100),
        });
      }
      state.fromId = id;
      closePlaid();
      renderAll();
      // Connecting always lands on Transfer Money: it is the only thing
      // a freshly linked account can do, and the toast confirms which
      // account was linked without a screen of its own.
      go('transfer');
      showToast(fill(S.toastLinked, 'account', accountLabel(activeAccount())));
    }

    el.usBanks.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.plaidPick = btn;
        el.usBanks.forEach(function (b) { b.classList.toggle('is-sel', b === btn); });
        el.plaidBank.textContent = btn.dataset.name;
        el.plaidAcct.textContent = btn.dataset.subtype + ' ••••' + btn.dataset.mask;
        el.plaidStep1.hidden = true;
        el.plaidStep2.hidden = false;
      });
    });

    el.plaidConnect.addEventListener('click', function () {
      if (state.plaidPick) linkAccount(state.plaidPick);
    });

    byH('plaid-close').addEventListener('click', closePlaid);
    byH('plaid-scrim').addEventListener('click', closePlaid);
    byH('modal-scrim').addEventListener('click', closeModal);

    el.modalBtn.addEventListener('click', function () {
      var kind = el.modalLayer.dataset.kind;
      closeModal();
      if (kind === 'link') openPlaid();
      else go('transfer');
    });

    /* --- Transfer Money ------------------------------------------------------ */

    function fillFromSelect() {
      el.from.textContent = '';
      state.linked.forEach(function (acct) {
        var opt = document.createElement('option');
        opt.value = acct.id;
        opt.textContent = accountLabel(acct);
        el.from.appendChild(opt);
      });
      var link = document.createElement('option');
      link.value = '__link';
      link.textContent = el.from.dataset.linkLabel;
      el.from.appendChild(link);
      if (state.fromId) el.from.value = state.fromId;
    }

    /* --- Plaid balance check ---------------------------------------------
     * Real-time enough to be worth showing: entering the screen, and every
     * change of account, starts a fresh check against that account's own
     * available balance. Add money is disabled for its whole duration.
     * -------------------------------------------------------------------- */

    function bankAvailable() {
      var acct = activeAccount();
      return acct ? acct.avail : 0;
    }

    function paintBalanceRow() {
      var acct = activeAccount();
      el.balRow.hidden = !acct;
      if (!acct) return;
      el.balSpin.hidden = state.balShown;
      el.balRow.classList.toggle('is-checking', !state.balShown);
      el.balText.textContent = state.balShown
        ? fill(S.balanceAvailable, 'amount', usd(acct.avail))
        : S.balanceChecking;
    }

    function resolveBalanceCheck() {
      pendingBalance = false;
      state.balShown = true;
      paintBalanceRow();
      renderTransfer();
    }

    function stopBalanceCheck() {
      balTimers.clear();
      pendingBalance = false;
    }

    function startBalanceCheck() {
      balTimers.clear();
      if (!activeAccount() || REDUCED) {
        // Under reduced motion the spinner stage is skipped entirely: the
        // balance is painted on the first frame of the screen.
        pendingBalance = false;
        state.balShown = true;
        paintBalanceRow();
        renderTransfer();
        return;
      }
      pendingBalance = true;
      state.balShown = false;
      paintBalanceRow();
      renderTransfer();
      // Started by the interaction that opened the screen or changed the
      // account. The observer below pauses and resumes it.
      balTimers.after(CFG.balanceMs, resolveBalanceCheck);
    }

    function renderTransfer() {
      var cents = parseCents(el.tAmount.value);
      var amount = cents || 0;
      var fee = transferFee(amount);
      el.tFee.textContent = usd(fee);
      el.tCredited.textContent = usd(amount - fee);
      renderFeeBreakdown();

      // Clearest message first: the minimum, then the daily ACH limit, then
      // what the bank actually holds. The bank rule only applies once the
      // check has resolved, since until then no balance has been checked.
      var avail = bankAvailable();
      var err = '';
      if (cents !== null && cents > 0 && cents < CFG.minTransfer) err = fill(S.errMin, 'min', usd(CFG.minTransfer));
      else if (cents !== null && cents > CFG.maxTransfer) err = fill(S.errMax, 'max', usd(CFG.maxTransfer));
      else if (cents !== null && activeAccount() && state.balShown && cents > avail) err = fill(S.errBankBalance, 'available', usd(avail));
      el.tErr.textContent = err;
      el.tErr.hidden = !err;
      el.addMoney.disabled = pendingBalance || !!err || !(cents !== null && cents >= CFG.minTransfer && cents <= CFG.maxTransfer);
    }

    function renderFeeBreakdown() {
      var amount = parseCents(el.tAmount.value) || 0;
      var haloki = amount > 0 ? halokiFee(amount) : 0;
      var ach = amount > 0 ? CFG.achFee : 0;
      el.feeTotal.textContent = usd(ach + haloki);
      el.feeHaloki.textContent = usd(haloki);
      el.feeAch.textContent = usd(ach);
    }

    function openFee() { renderFeeBreakdown(); el.feeLayer.classList.add('is-open'); }

    function closeFee() { el.feeLayer.classList.remove('is-open'); }

    el.feeInfo.addEventListener('click', openFee);
    byH('fee-close').addEventListener('click', closeFee);
    byH('fee-scrim').addEventListener('click', closeFee);

    el.tAmount.addEventListener('input', function () {
      sanitizeInput(el.tAmount);
      syncPresets('transfer', el.tAmount.value);
      renderTransfer();
    });

    el.from.addEventListener('change', function () {
      if (el.from.value === '__link') {
        el.from.value = state.fromId || '';
        openPlaid();
        return;
      }
      state.fromId = el.from.value;
      renderHome();
      // A different account is a different balance, so the check re-runs.
      startBalanceCheck();
    });

    function completeFunding() {
      pendingFunding = false;
      state.txns.forEach(function (tx) {
        if (tx.kind === 'fund' && tx.status === 'pending') tx.status = 'done';
      });
      renderAll();
    }

    el.addMoney.addEventListener('click', function () {
      var cents = parseCents(el.tAmount.value);
      if (pendingBalance) return;
      if (cents === null || cents < CFG.minTransfer || cents > CFG.maxTransfer) return;
      if (activeAccount() && cents > bankAvailable()) return;
      var acct = activeAccount();
      var fee = transferFee(cents);
      // The credit is optimistic: the balance moves now, while the debit
      // is still with the processor and the ACH leg is days from settling.
      state.balance += cents - fee;
      state.txns.unshift({
        id: 'tx' + state.txns.length + '-fund',
        kind: 'fund',
        status: REDUCED ? 'done' : 'pending',
        amount: cents,
        fee: fee,
        credited: cents - fee,
        bankName: acct ? acct.name : '',
        mask: acct ? acct.mask : '',
      });
      el.tAmount.value = '';
      syncPresets('transfer', '');
      renderAll();
      go('home');

      if (REDUCED) return;
      pendingFunding = true;
      fundTimers.after(FUND_PENDING_MS, completeFunding);
    });

    /* --- Send Money ---------------------------------------------------------- */

    /* Send Money is free, so the whole amount converts. */
    function sendQuote() {
      var cents = parseCents(el.sAmount.value) || 0;
      return { amount: cents, vnd: toVnd(cents) };
    }

    function renderQuote() {
      var q = sendQuote();
      el.qSend.textContent = usd(q.amount);
      el.qRate.textContent = rateText();
      el.qGets.textContent = vnd(q.vnd);

      var cents = parseCents(el.sAmount.value);
      var err = '';
      if (cents !== null && cents > 0 && cents < CFG.minSend) err = fill(S.errMin, 'min', usd(CFG.minSend));
      else if (cents !== null && cents > state.balance) err = fill(S.errBalance, 'available', usd(state.balance));
      el.sErr.textContent = err;
      el.sErr.hidden = !err;

      // Purpose is fixed and read-only, so the amount is the only gate.
      el.sendContinue.disabled = !(cents !== null && cents >= CFG.minSend && cents <= state.balance);
    }

    function syncPresets(target, value) {
      var cents = parseCents(value);
      $$('[data-h-preset]').forEach(function (btn) {
        if (btn.dataset.target !== target) return;
        btn.classList.toggle('is-on', cents !== null && cents === Math.round(Number(btn.dataset.hPreset) * 100));
      });
    }

    $$('[data-h-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.dataset.target === 'transfer' ? el.tAmount : el.sAmount;
        input.value = btn.dataset.hPreset;
        syncPresets(btn.dataset.target, input.value);
        if (btn.dataset.target === 'transfer') renderTransfer();
        else renderQuote();
      });
    });

    el.sAmount.addEventListener('input', function () {
      sanitizeInput(el.sAmount);
      syncPresets('send', el.sAmount.value);
      renderQuote();
    });

    el.sendContinue.addEventListener('click', function () {
      if (el.sendContinue.disabled) return;
      go('sendReview');
    });

    /* --- recipient --------------------------------------------------------------
     * One fixed payout account, rendered read-only at build time. Nothing
     * is selected and nothing is typed, so this step has no validation.
     * ---------------------------------------------------------------------------- */

    var RCP = screenEl('sendRecipient').dataset;

    el.rcpContinue.addEventListener('click', function () { go('sendAmount'); });

    /* --- review, rate lock, confirm ---------------------------------------------- */

    /* Purpose is a fixed, read-only field, so its label is its value. */
    function purposeLabel() { return el.purpose.value; }

    function renderReview() {
      var q = sendQuote();
      el.rvName.textContent = RCP.rcpName;
      el.rvBank.textContent = RCP.rcpBank + ' ••••' + RCP.rcpMask;
      el.rvSend.textContent = usd(q.amount);
      el.rvRate.textContent = rateText();
      el.rvPurpose.textContent = purposeLabel();
      el.rvGets.textContent = vnd(q.vnd);
    }

    function paintLock() { el.lock.textContent = fmtClock(state.lockLeft); }

    function tickLock() {
      if (state.lockLeft <= 0) return;
      state.lockLeft -= 1;
      paintLock();
      if (state.lockLeft <= 0) lockTimers.clear();
    }

    function startLock() {
      lockTimers.clear();
      state.lockLeft = CFG.lockSecs;
      paintLock();
      if (REDUCED) return;
      // Started by a click inside the frame, so the frame is on screen by
      // definition. The observer below still pauses and resumes this.
      lockTimers.every(1000, tickLock);
    }

    function resumeLock() {
      lockTimers.clear();
      if (REDUCED || state.lockLeft <= 0) return;
      lockTimers.every(1000, tickLock);
    }

    function stopLock() { lockTimers.clear(); }

    function completePayout() {
      pendingPayout = false;
      state.txns.forEach(function (tx) {
        if (tx.kind === 'send' && tx.status === 'sending') tx.status = 'done';
      });
      renderAll();
    }

    el.confirm.addEventListener('click', function () {
      var q = sendQuote();
      if (q.amount < CFG.minSend || q.amount > state.balance) return;

      state.balance -= q.amount;
      state.txns.unshift({
        id: 'tx' + state.txns.length + '-send',
        kind: 'send',
        status: 'sending',
        amount: q.amount,
        vnd: q.vnd,
        rcpName: RCP.rcpName,
        rcpBank: RCP.rcpBank,
        rcpMask: RCP.rcpMask,
        purpose: purposeLabel(),
      });

      stopLock();
      el.sAmount.value = '';
      syncPresets('send', '');
      renderAll();
      go('home');

      if (REDUCED) {
        completePayout();
        return;
      }
      pendingPayout = true;
      payTimers.after(PAYOUT_MS, completePayout);
    });

    /* --- transaction status -------------------------------------------------------- */

    function renderStatus(tx) {
      el.stFund.hidden = tx.kind !== 'fund';
      el.stSend.hidden = tx.kind !== 'send';
      if (tx.kind === 'fund') {
        el.stFHead.textContent = S.txAdded + ' · ' + usd(tx.amount);
        el.stFFrom.textContent = S.fromLabel + ' ' + tx.bankName + ' ••••' + tx.mask;
        el.stFFee.textContent = usd(tx.fee);
        el.stFCredited.textContent = usd(tx.credited);
        return;
      }
      el.stSHead.textContent = S.txSent + ' · ' + usd(tx.amount);
      el.stSTo.textContent = tx.rcpName + ' · ' + tx.rcpBank + ' ••••' + tx.rcpMask;
      el.stSGot.textContent = vnd(tx.vnd);
      el.stSRate.textContent = rateText();
      el.stSPurpose.textContent = tx.purpose;
      var done = tx.status === 'done';
      el.stSPaid.classList.toggle('is-done', done);
      el.stSPaid.classList.toggle('is-pending', !done);
      el.stSPaidTime.textContent = done ? S.justNow : S.sending;
      el.stSNotice.hidden = !done;
      el.stSNoticeText.textContent = fill(S.notice, 'amount', vndDots(tx.vnd));
    }

    function openStatus(tx) {
      state.statusTxn = tx;
      renderStatus(tx);
      go('status');
    }

    /* --- home actions and back ------------------------------------------------------- */

    el.actTransfer.addEventListener('click', function () {
      if (!state.linked.length) { openModal('link'); return; }
      go('transfer');
    });

    el.actSend.addEventListener('click', function () {
      if (!state.linked.length) { openModal('link'); return; }
      if (state.balance < CFG.minSend) { openModal('bal'); return; }
      go('sendRecipient');
    });

    el.acctChip.addEventListener('click', function () { go('accounts'); });
    byH('link-another').addEventListener('click', openPlaid);

    el.back.addEventListener('click', function () {
      var target = BACK[state.screen];
      if (target) go(target);
    });

    /* --- visibility gating ------------------------------------------------------------ */

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (visible) return;
            visible = true;
            if (state.screen === 'sendReview') resumeLock();
            if (pendingPayout && !REDUCED) payTimers.after(PAYOUT_MS, completePayout);
            if (pendingFunding && !REDUCED) fundTimers.after(FUND_PENDING_MS, completeFunding);
            if (pendingBalance && !REDUCED) balTimers.after(CFG.balanceMs, resolveBalanceCheck);
            if (pendingToast) toastTimers.after(TOAST_MS, hideToast);
          } else if (visible) {
            visible = false;
            lockTimers.clear();
            payTimers.clear();
            fundTimers.clear();
            toastTimers.clear();
            balTimers.clear();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el.frame);

    fillFromSelect();
    renderAll();
    go('home');
  }

  /* ------------------------------------------------------------------ *
   * Simulation 04 — Fan-out on write (free exploration)
   *
   * Kept deliberately high level: four nodes and a follower grid. post and
   * feed are records, so they are created by a run and destroyed by the
   * delete; Kafka and the consumer are infrastructure and stay on the board.
   * Node positions come from CSS grid and the edges between them are measured
   * from the DOM, so nothing here holds a coordinate and the mobile layout
   * needs no second copy of anything.
   * ------------------------------------------------------------------ */

  function initFanout(root) {
    function $(sel) { return root.querySelector(sel); }
    function $$(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
    function hole(name) { return root.querySelector('[data-f="' + name + '"]'); }
    function holes(name) { return $$('[data-f="' + name + '"]'); }

    var FOLLOWERS = Number(root.dataset.followers);
    var BATCH = Number(root.dataset.batchSize);
    var STAGE_MS = Number(root.dataset.stageMs);
    var PULSE_MS = Number(root.dataset.pulseMs);
    var BATCH_MS = Number(root.dataset.batchMs);
    var DELETE_MS = Number(root.dataset.deleteMs);
    var LIKES = Number(root.dataset.likes);
    var COMMENTS = Number(root.dataset.comments);
    var ENGAGE_MS = Number(root.dataset.engageMs);
    var ENGAGE_DELAY = Number(root.dataset.engageDelay);
    var READ_BASE = Number(root.dataset.readBase);
    var READ_PER_CHAR = Number(root.dataset.readPerChar);
    var READ_MIN = Number(root.dataset.readMin);
    var READ_MAX = Number(root.dataset.readMax);
    var NUMLOC = LOCALE === 'vi' ? 'vi-VN' : 'en-US';
    var BATCHES = Math.ceil(FOLLOWERS / BATCH);
    var DOTS = $$('.f-dot').length;

    var CAN_PULSE = typeof CSS !== 'undefined' && CSS.supports &&
      CSS.supports('offset-path', 'path("M 0 0 L 1 1")');

    var SPRAY = [0.12, 0.31, 0.5, 0.69, 0.88];
    var SPRAY_IDS = SPRAY.map(function (frac, i) { return 'spray' + i; });

    var EDGES = [
      { id: 'post-feed', a: 'post', b: 'feed' },
      { id: 'feed-kafka', a: 'feed', b: 'kafka' },
      { id: 'kafka-consumer', a: 'kafka', b: 'consumer' },
    ].concat(SPRAY.map(function (frac, i) {
      return { id: 'spray' + i, a: 'consumer', b: 'cloud', bf: frac };
    }));

    var board = $('.f-board');
    var svg = $('.f-edges');
    var layer = $('.f-pulses');
    var paths = {};
    // Which edges are showing, kept apart from the DOM. Below lg the board is
    // hidden while the phone tab is open, so it cannot be measured and its
    // paths do not exist yet; when it does get drawn, this is what tells it
    // how far the run had got.
    var shown = {};

    // Which sides an edge leaves and arrives on is decided by where the two
    // nodes actually sit, not written down anywhere. The board is a column on
    // desktop with the follower grid beside it and a single stack on mobile,
    // and the same edge has to read correctly in both.
    function overlapX(ra, rb) { return Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left); }
    function overlapY(ra, rb) { return Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top); }

    function sides(ra, rb) {
      var ox = overlapX(ra, rb);
      var oy = overlapY(ra, rb);
      // A node that sits under another one is joined vertically even when it
      // is much wider, which is what the follower grid is.
      if (ox > 0 && oy <= 0) return rb.top >= ra.top ? ['bottom', 'top'] : ['top', 'bottom'];
      if (oy > 0 && ox <= 0) return rb.left >= ra.left ? ['right', 'left'] : ['left', 'right'];
      var dx = (rb.left + rb.right) / 2 - (ra.left + ra.right) / 2;
      var dy = (rb.top + rb.bottom) / 2 - (ra.top + ra.bottom) / 2;
      if (Math.abs(dy) >= Math.abs(dx)) return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
      return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
    }

    function anchor(rect, side, frac) {
      var f = typeof frac === 'number' ? frac : 0.5;
      if (side === 'left') return { x: rect.left, y: rect.top + rect.height * f };
      if (side === 'right') return { x: rect.right, y: rect.top + rect.height * f };
      if (side === 'top') return { x: rect.left + rect.width * f, y: rect.top };
      return { x: rect.left + rect.width * f, y: rect.bottom };
    }

    function curvePath(a, b, side) {
      if (side === 'left' || side === 'right') {
        var dx = (b.x - a.x) * 0.5;
        return 'M ' + a.x + ' ' + a.y +
          ' C ' + (a.x + dx) + ' ' + a.y + ' ' + (b.x - dx) + ' ' + b.y + ' ' + b.x + ' ' + b.y;
      }
      var dy = (b.y - a.y) * 0.5;
      return 'M ' + a.x + ' ' + a.y +
        ' C ' + a.x + ' ' + (a.y + dy) + ' ' + b.x + ' ' + (b.y - dy) + ' ' + b.x + ' ' + b.y;
    }

    function drawEdges() {
      if (!board || !board.offsetParent) return;
      var origin = board.getBoundingClientRect();
      if (!origin.width) return;

      function local(id) {
        var node = board.querySelector('[data-node="' + id + '"]');
        if (!node) return null;
        var r = node.getBoundingClientRect();
        return {
          left: r.left - origin.left,
          right: r.right - origin.left,
          top: r.top - origin.top,
          bottom: r.bottom - origin.top,
          width: r.width,
          height: r.height,
        };
      }

      EDGES.forEach(function (edge) {
        var ra = local(edge.a);
        var rb = local(edge.b);
        if (!ra || !rb) return;
        var dir = sides(ra, rb);
        var d = curvePath(anchor(ra, dir[0]), anchor(rb, dir[1], edge.bf), dir[0]);
        paths[edge.id] = d;

        var path = svg.querySelector('[data-edge="' + edge.id + '"]');
        if (!path) {
          path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('data-edge', edge.id);
          path.setAttribute('class', 'f-edge');
          svg.appendChild(path);
        }
        path.setAttribute('d', d);
        path.classList.toggle('is-on', !!shown[edge.id]);
        path.classList.toggle('is-lit', shown[edge.id] === 'lit');
      });
    }

    function edgeOn(ids, lit) {
      ids.forEach(function (id) {
        shown[id] = lit === false ? 'on' : 'lit';
        var path = svg.querySelector('[data-edge="' + id + '"]');
        if (!path) return;
        path.classList.add('is-on');
        path.classList.toggle('is-lit', lit !== false);
      });
    }

    function firePulse(edgeId, delay) {
      if (!CAN_PULSE || REDUCED) return;
      var d = paths[edgeId];
      if (!d) return;
      var dot = document.createElement('span');
      dot.className = 'f-pulse';
      dot.style.offsetPath = 'path("' + d + '")';
      dot.style.setProperty('--f-dur', PULSE_MS + 'ms');
      if (delay) dot.style.animationDelay = delay + 'ms';
      dot.addEventListener('animationend', function () {
        if (dot.parentNode) dot.parentNode.removeChild(dot);
      });
      layer.appendChild(dot);
    }

    function clearPulses() {
      while (layer.firstChild) layer.removeChild(layer.firstChild);
    }

    function node(id) { return board.querySelector('[data-node="' + id + '"]'); }

    /* State ----------------------------------------------------------- */

    var timers = createTimers();
    // Starts true and is corrected by the observer below. If the observer
    // never reports, the simulation still runs rather than sitting dead.
    var visible = true;
    var resumeFlow = null;
    var run = null;
    var state = { rows: 0, likes: 0 };
    var engageTimer = null;
    // The notes this run has passed, in order, and where the reader is in
    // them. Only the stepper moves the index off the end.
    var capTrail = [];
    var capIdx = -1;
    // The trail is only offered once the run has laid down its last note. The
    // fan-out step ends about a second before the engagement note arrives, so
    // revealing the stepper at the end of the chain would put it on screen
    // while it was still about to grow.
    var capsSettled = false;

    var el = {
      frame: $('.sim-frame'),
      boardsWrap: $('.f-boards'),
      composer: hole('composer'),
      publish: hole('publish'),
      del: hole('delete'),
      capNav: hole('capnav'),
      capPrev: hole('cap-prev'),
      capNext: hole('cap-next'),
    };

    function fmt(n) { return Number(n).toLocaleString(NUMLOC); }

    function setText(name, value) {
      holes(name).forEach(function (n) { n.textContent = value; });
    }

    function renderRows(n) {
      state.rows = n;
      setText('uf-count', fmt(n));
      var lit = Math.round((n / FOLLOWERS) * DOTS);
      $$('.f-dot').forEach(function (dot, i) { dot.classList.toggle('is-lit', i < lit); });
    }

    /* Engagement lands on the feed record and nowhere else. Comments are
       derived from the same progress value rather than run on a second timer,
       so the two counters can never disagree about how far along the run is,
       and only one resumeFlow slot is ever in play. */
    function renderEngagement(likes) {
      state.likes = likes;
      setText('likes', fmt(likes));
      setText('comments', fmt(LIKES > 0 ? Math.round((likes / LIKES) * COMMENTS) : 0));
    }

    function stopEngagement() {
      if (engageTimer === null) return;
      timers.kill(engageTimer);
      engageTimer = null;
    }

    function startEngagement() {
      // Delete can be pressed inside the ENGAGE_DELAY window, and that pending
      // schedule outlives it. Engagement belongs to a live post and nothing
      // else, so the phase is the guard rather than a second cancel path.
      if (root.dataset.phase !== 'live') return;
      stopEngagement();
      setCap('p6');
      // Last note of the run: the trail is complete, so the stepper can show.
      capsSettled = true;
      syncCapNav();
      if (REDUCED) { renderEngagement(LIKES); return; }
      resumeFlow = function () { startEngagement(); };
      if (!visible) return;
      var from = state.likes;
      var ticks = Math.max(1, Math.round(ENGAGE_MS / 120));
      var i = 0;
      engageTimer = timers.every(120, function () {
        i += 1;
        renderEngagement(Math.round(from + (LIKES - from) * (i / ticks)));
        if (i < ticks) return;
        stopEngagement();
        renderEngagement(LIKES);
        resumeFlow = null;
      });
    }

    function setContent(text) {
      setText('owner-content', text);
    }

    /* Captions ---------------------------------------------------------- *
     * A step lasts as long as its motion or as long as its note takes to
     * read, whichever is longer, and the note is only paid for when it
     * actually changes — four consecutive steps sharing one delete note are
     * four moves, not four readings. Length is measured off the rendered
     * text, so a locale that says it in more words gets more time.         */

    function capText(key) {
      var node = root.querySelector('.f-cap[data-cap="' + key + '"]');
      return node ? node.textContent.trim() : '';
    }

    function readMs(key) {
      var n = capText(key).length;
      return Math.min(READ_MAX, Math.max(READ_MIN, READ_BASE + n * READ_PER_CHAR));
    }

    function stepMs(step, prevCap) {
      var motion = step.edges ? PULSE_MS + 60 : STAGE_MS;
      if (!step.cap || step.cap === prevCap) return motion;
      return Math.max(motion, readMs(step.cap));
    }

    function syncCapNav() {
      // Never while something is moving, never before the last note has
      // landed, and never for a single note.
      var on = capsSettled && root.dataset.running === '0' && capTrail.length > 1;
      el.capNav.hidden = !on;
      if (!on) return;
      el.capPrev.disabled = capIdx <= 0;
      el.capNext.disabled = capIdx >= capTrail.length - 1;
    }

    /* Records the note and shows it. A reader who has stepped back keeps
       their place: a note arriving late — engagement lands a beat after the
       run ends — joins the trail without yanking them to the end of it. */
    function setCap(key) {
      var atEnd = capIdx === capTrail.length - 1;
      if (capTrail[capTrail.length - 1] !== key) capTrail.push(key);
      if (atEnd) {
        capIdx = capTrail.length - 1;
        root.dataset.cap = key;
      }
      syncCapNav();
    }

    function stepCap(delta) {
      var next = capIdx + delta;
      if (next < 0 || next >= capTrail.length) return;
      capIdx = next;
      root.dataset.cap = capTrail[next];
      syncCapNav();
    }

    function resetCaps(key) {
      capTrail = [];
      capIdx = -1;
      capsSettled = false;
      root.dataset.cap = key;
      syncCapNav();
    }

    /* Timing. Everything that waits goes through these two, so a frame that
       scrolls out of view drops its timers and picks the same step up when it
       comes back. */

    function schedule(ms, fn) {
      if (REDUCED) { fn(); return; }
      resumeFlow = function () { schedule(ms, fn); };
      if (!visible) return;
      timers.after(ms, function () { resumeFlow = null; fn(); });
    }

    function animate(target, ms, get, set, done) {
      if (REDUCED) { set(target); done(); return; }
      resumeFlow = function () { animate(target, ms, get, set, done); };
      if (!visible) return;
      var from = get();
      var ticks = Math.max(1, Math.round(ms / 40));
      var i = 0;
      var h = timers.every(40, function () {
        i += 1;
        set(Math.round(from + (target - from) * (i / ticks)));
        if (i < ticks) return;
        timers.kill(h);
        set(target);
        resumeFlow = null;
        done();
      });
    }

    /* Flow engine ------------------------------------------------------ */

    function startFlow(steps, finish) {
      drawEdges();
      root.dataset.ran = '1';
      root.dataset.running = '1';
      // Each run tells its own story, so the stepper never walks back from a
      // delete into the notes of the publish that preceded it.
      capTrail = [];
      capIdx = -1;
      capsSettled = false;
      syncCapNav();
      run = { steps: steps, idx: -1, finish: finish };
      advance();
    }

    function advance() {
      if (!run) return;
      var prev = run.steps[run.idx];
      if (prev && prev.nodes) {
        prev.nodes.forEach(function (id) {
          var n = node(id);
          if (n) { n.classList.remove('is-active'); n.classList.add('is-done'); }
        });
      }

      run.idx += 1;
      if (run.idx >= run.steps.length) {
        var finish = run.finish;
        run = null;
        root.dataset.running = '0';
        syncCapNav();
        if (finish) finish();
        return;
      }

      var prevCap = root.dataset.cap;
      var step = run.steps[run.idx];
      if (step.cap) setCap(step.cap);
      if (step.edges) {
        edgeOn(step.edges);
        step.edges.forEach(function (id, i) { firePulse(id, i * 60); });
      }
      if (step.show) step.show.forEach(function (id) {
        var n = node(id);
        if (n) n.classList.add('is-present');
      });
      if (step.nodes) step.nodes.forEach(function (id) {
        var n = node(id);
        if (n) n.classList.add('is-active');
      });
      if (step.enter) step.enter();
      if (step.async) return;
      schedule(step.ms || stepMs(step, prevCap), advance);
    }

    /* Publish ---------------------------------------------------------- */

    function publishFlow() {
      var text = (el.composer.value || '').trim();
      if (!text || root.dataset.running === '1') return;
      setContent(text);
      root.dataset.phase = 'publishing';
      startFlow([
        { show: ['post'], nodes: ['post'], cap: 'p1' },
        { edges: ['post-feed'], show: ['feed'], nodes: ['feed'], cap: 'p2' },
        { edges: ['feed-kafka'], show: ['kafka'], nodes: ['kafka'], cap: 'p3' },
        { edges: ['kafka-consumer'], show: ['consumer'], nodes: ['consumer'], cap: 'p4' },
        { edges: SPRAY_IDS, show: ['cloud'], nodes: ['cloud'], cap: 'p5', async: true, enter: writeBatches },
      ], function () {
        root.dataset.phase = 'live';
        // A beat after the last batch lands, so the fan-out has visibly
        // finished before anything starts moving on the feed record.
        schedule(ENGAGE_DELAY, startEngagement);
      });
    }

    // The follower list is expanded in batches, so the grid fills in waves
    // rather than all at once.
    function writeBatches() {
      root.dataset.hasrows = '1';
      var b = 0;

      function nextBatch() {
        if (b >= BATCHES) { advance(); return; }
        b += 1;
        var target = Math.min(b * BATCH, FOLLOWERS);
        if (b > 1) SPRAY_IDS.forEach(function (id, i) { firePulse(id, i * 60); });
        animate(
          target,
          BATCH_MS,
          function () { return state.rows; },
          renderRows,
          function () { schedule(180, nextBatch); }
        );
      }

      nextBatch();
    }

    /* Delete. The event runs the same chain the post did, and only then does
       anything go: the follower records first, then the feed record, then the
       post, because nothing may be left pointing at something that is gone. */

    function deleteFlow() {
      if (root.dataset.running === '1') return;
      stopEngagement();
      resumeFlow = null;
      root.dataset.phase = 'clearing';
      startFlow([
        { nodes: ['post'], cap: 'd1' },
        { edges: ['post-feed'], nodes: ['feed'], cap: 'd1' },
        { edges: ['feed-kafka'], nodes: ['kafka'], cap: 'd1' },
        { edges: ['kafka-consumer'], nodes: ['consumer'], cap: 'd1' },
        { edges: SPRAY_IDS, cap: 'd2', async: true, enter: drain },
        // Far enough apart to be read as three things going one after
        // another, rather than one thing going. That spacing now comes from
        // the reading pace rather than a hand-set number.
        { cap: 'd3', enter: function () { hide('feed'); } },
        {
          cap: 'd4',
          enter: function () {
            hide('post');
            // The infrastructure leaves with the last record, because the board
            // has to end where it opened: empty.
            hide('kafka');
            hide('consumer');
          },
        },
      ], resetAll);
    }

    function hide(id) {
      var n = node(id);
      if (n) n.classList.remove('is-present', 'is-active', 'is-done');
      if (id === 'feed') offEdges(['post-feed', 'feed-kafka']);
      if (id === 'kafka') offEdges(['kafka-consumer']);
    }

    function offEdges(ids) {
      ids.forEach(function (id) {
        delete shown[id];
        var path = svg.querySelector('[data-edge="' + id + '"]');
        if (path) path.classList.remove('is-on', 'is-lit');
      });
    }

    function drain() {
      animate(
        0,
        DELETE_MS,
        function () { return state.rows; },
        renderRows,
        function () {
          root.dataset.hasrows = '0';
          offEdges(SPRAY_IDS);
          hide('cloud');
          advance();
        }
      );
    }

    // Deleting the post puts the whole simulation back where it started, so
    // publishing again behaves exactly like the first time.
    function resetAll() {
      stopEngagement();
      renderEngagement(0);
      renderRows(0);
      clearPulses();
      offEdges(EDGES.map(function (e) { return e.id; }));
      $$('[data-life="1"]').forEach(function (n) {
        n.classList.remove('is-active', 'is-done', 'is-present');
      });
      root.dataset.phase = 'idle';
      resetCaps('idle');
      root.dataset.ran = '0';
      root.dataset.hasrows = '0';
      syncPublish();
    }

    function syncPublish() {
      el.publish.disabled = !(el.composer.value || '').trim();
    }

    /* Wiring ----------------------------------------------------------- */

    el.capPrev.addEventListener('click', function () { stepCap(-1); });
    el.capNext.addEventListener('click', function () { stepCap(1); });

    el.composer.addEventListener('input', syncPublish);
    el.publish.addEventListener('click', publishFlow);
    el.del.addEventListener('click', deleteFlow);

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(drawEdges);
      ro.observe(el.boardsWrap);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (visible) return;
              visible = true;
              drawEdges();
              var flow = resumeFlow;
              resumeFlow = null;
              if (flow) flow();
            } else if (visible) {
              visible = false;
              timers.clear();
              clearPulses();
            }
          });
        },
        { threshold: 0.25 }
      );
      io.observe(el.frame);
    }

    setContent((el.composer.value || '').trim());
    renderRows(0);
    syncPublish();
    drawEdges();
  }

  /* ------------------------------------------------------------------ */

  document.querySelectorAll('[data-sim]').forEach(function (root) {
    var kind = root.dataset.sim;
    if (kind === 'learning') initLearning(root);
    else if (kind === 'meeting') initMeeting(root);
    else if (kind === 'haloki') initHaloki(root);
    else if (kind === 'fanout') initFanout(root);
  });
})();
