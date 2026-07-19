/* ============================================================
   Learn tab — course marketplace.

   Three views inside #panel-learn: the course grid (home), a single
   course's lesson list, and a lesson (reading + practice quiz).

   Progress + coins reuse the existing P2Pi store:
   - lesson done  -> flag  "lesson_<course>_<lesson>"  (+2 coins, once)
   - course done  -> flag  "course_<course>"           (+5 coins, once)
   awardOnce() both sets the flag and awards the coins a single time, so
   everything persists across refreshes and never double-pays.
   ============================================================ */
(function initLearn() {
  const home = document.getElementById("course-home");
  const courseView = document.getElementById("course-view");
  const lessonView = document.getElementById("lesson-view");
  if (!home) return; // Learn panel not on the page

  const COURSES = window.P2PI_COURSES || [];
  const SOON = window.P2PI_COURSES_SOON || [];

  // --- progress helpers (backed by store flags) ---
  const lessonFlag = (c, l) => `lesson_${c.id}_${l.id}`;
  const courseFlag = (c) => `course_${c.id}`;
  const isLessonDone = (c, l) => P2Pi.hasFlag(lessonFlag(c, l));
  const doneCount = (c) => c.lessons.filter((l) => isLessonDone(c, l)).length;
  const coursePct = (c) => Math.round((100 * doneCount(c)) / c.lessons.length);

  const coinToast = (n, bonus) => {
    if (typeof showCoinToast === "function") showCoinToast(n, !!bonus);
  };

  function show(view) {
    [home, courseView, lessonView].forEach((v) => (v.hidden = v !== view));
    // Scroll the Learn panel back to the top on every view change.
    const panel = document.getElementById("panel-learn");
    if (panel) panel.scrollTop = 0;
  }

  /* ---------------- Home: course grid ---------------- */
  function renderHome() {
    let html = `<h1 class="learn-h1">Learn 📚</h1>
      <p class="learn-sub">Bite-size lessons that make money make sense. Pass a quick quiz to earn coins.</p>
      <div class="course-grid">`;

    COURSES.forEach((c) => {
      const pct = coursePct(c);
      const label = pct === 0 ? "Start" : pct === 100 ? "Review ✓" : "Continue";
      html += `<button class="course-card" data-course="${c.id}" type="button">
          <div class="cc-emoji">${c.emoji}</div>
          <div class="cc-title">${c.title}</div>
          <div class="cc-tag">${c.tagline}</div>
          <div class="cc-meta">${c.lessons.length} lessons${pct === 100 ? " · done" : ""}</div>
          <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span class="cc-btn">${label}</span>
        </button>`;
    });

    SOON.forEach((s) => {
      html += `<div class="course-card locked" aria-disabled="true">
          <div class="cc-emoji">${s.emoji}</div>
          <div class="cc-title">${s.title}</div>
          <div class="cc-tag">${s.tagline}</div>
          <span class="cc-soon">🔒 Coming soon</span>
        </div>`;
    });

    html += `</div>`;
    home.innerHTML = html;
    home.querySelectorAll(".course-card[data-course]").forEach((card) => {
      card.addEventListener("click", () => {
        const c = COURSES.find((x) => x.id === card.dataset.course);
        if (c) renderCourse(c);
      });
    });
    show(home);
  }

  /* ---------------- Course: lesson list ---------------- */
  function renderCourse(c) {
    const pct = coursePct(c);
    let html = `<button class="back-link" data-back="home" type="button">← All courses</button>
      <div class="course-head">
        <div class="ch-emoji">${c.emoji}</div>
        <div><h2 class="ch-title">${c.title}</h2><p class="ch-tag">${c.tagline}</p></div>
      </div>
      <div class="progress big"><div class="progress-fill" style="width:${pct}%"></div></div>
      <p class="course-progress-text">${doneCount(c)} of ${c.lessons.length} lessons complete</p>
      <ol class="lesson-list">`;

    c.lessons.forEach((l, i) => {
      const done = isLessonDone(c, l);
      html += `<li><button class="lesson-item ${done ? "done" : ""}" data-lesson="${i}" type="button">
          <span class="li-num">${done ? "✓" : i + 1}</span>
          <span class="li-title">${l.title}</span>
          <span class="li-go">›</span>
        </button></li>`;
    });
    html += `</ol>`;
    courseView.innerHTML = html;

    courseView.querySelector('[data-back="home"]').addEventListener("click", renderHome);
    courseView.querySelectorAll(".lesson-item").forEach((btn) => {
      btn.addEventListener("click", () => renderLesson(c, +btn.dataset.lesson));
    });
    show(courseView);
  }

  // A lesson's optional "try it in the Simulator" call-to-action.
  function tryItHTML(lesson, id) {
    if (!lesson.tryIt) return "";
    return `<button class="tryit-cta" id="${id}" type="button">
        <span class="tryit-icon">🎮</span><span>${lesson.tryIt.label}</span></button>`;
  }
  function wireTryIt(lesson, id, courseTitle) {
    const btn = lessonView.querySelector("#" + id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (typeof window.P2PI_loadSimulatorPreset === "function") {
        window.P2PI_loadSimulatorPreset(lesson.tryIt.simulatorPreset, courseTitle);
      }
    });
  }

  /* ---------------- Lesson: reading, then quiz ---------------- */
  function renderLesson(c, index) {
    const lesson = c.lessons[index];
    lessonView.innerHTML = `
      <button class="back-link" data-back="course" type="button">← ${c.title}</button>
      <div class="lesson-read" id="lesson-read">
        <h2 class="lesson-title">${lesson.title}</h2>
        ${lesson.content.map((p) => `<p>${p}</p>`).join("")}
        <button class="run-btn" id="start-quiz" type="button">Practice what you learned →</button>
        ${tryItHTML(lesson, "tryit-read")}
      </div>
      <div class="lesson-quiz" id="lesson-quiz" hidden></div>`;

    lessonView.querySelector('[data-back="course"]').addEventListener("click", () => renderCourse(c));
    lessonView.querySelector("#start-quiz").addEventListener("click", () => startQuiz(c, index));
    wireTryIt(lesson, "tryit-read", c.title);
    show(lessonView);
  }

  function startQuiz(c, index) {
    const lesson = c.lessons[index];
    const read = lessonView.querySelector("#lesson-read");
    const quizBox = lessonView.querySelector("#lesson-quiz");
    read.hidden = true;
    quizBox.hidden = false;
    let q = 0;

    function renderQuestion() {
      const item = lesson.quiz[q];
      quizBox.innerHTML = `
        <div class="quiz-progress">Question ${q + 1} of ${lesson.quiz.length}</div>
        <div class="quiz-q">${item.question}</div>
        <div class="quiz-options">
          ${item.options.map((o, i) => `<button class="quiz-opt" data-i="${i}" type="button">${o}</button>`).join("")}
        </div>
        <div class="quiz-feedback" id="quiz-feedback" hidden></div>
        <button class="run-btn" id="quiz-next" type="button" hidden>Next →</button>`;

      const feedback = quizBox.querySelector("#quiz-feedback");
      const nextBtn = quizBox.querySelector("#quiz-next");

      quizBox.querySelectorAll(".quiz-opt").forEach((opt) => {
        opt.addEventListener("click", () => {
          const chosen = +opt.dataset.i;
          if (chosen === item.correctIndex) {
            opt.classList.add("correct");
            feedback.className = "quiz-feedback correct";
            feedback.textContent = "✅ " + item.feedbackCorrect;
            feedback.hidden = false;
            // Lock the question once answered correctly.
            quizBox.querySelectorAll(".quiz-opt").forEach((o) => (o.disabled = true));
            nextBtn.hidden = false;
            nextBtn.textContent = q < lesson.quiz.length - 1 ? "Next →" : "Finish lesson →";
          } else {
            // Kind correction; let them try again.
            opt.classList.add("wrong");
            opt.disabled = true;
            feedback.className = "quiz-feedback wrong";
            feedback.textContent = "💡 " + item.feedbackWrong;
            feedback.hidden = false;
          }
        });
      });

      nextBtn.addEventListener("click", () => {
        q += 1;
        if (q < lesson.quiz.length) renderQuestion();
        else finishLesson(c, index);
      });
    }
    renderQuestion();
  }

  function finishLesson(c, index) {
    const lesson = c.lessons[index];
    // +2 coins the first time this lesson's quiz is passed.
    const gained = P2Pi.awardOnce(lessonFlag(c, lesson), 2);
    if (gained > 0) coinToast(2, false);

    // Did that complete the whole course? +5 bonus, once.
    const courseJustDone = doneCount(c) === c.lessons.length && !P2Pi.hasFlag(courseFlag(c));
    let bonus = 0;
    if (courseJustDone) {
      bonus = P2Pi.awardOnce(courseFlag(c), 5);
      if (bonus > 0) setTimeout(() => coinToast(5, true), 900);
    }

    const quizBox = lessonView.querySelector("#lesson-quiz");
    if (courseJustDone) {
      quizBox.innerHTML = `
        <div class="celebrate-wrap course-complete">
          <div class="celebrate big">🏆</div>
          <h2>Course complete!</h2>
          <p class="cc-done-name">You finished ${c.title} 🎉</p>
          ${bonus > 0 ? `<p class="coins-won">+5 bonus coins</p>` : ""}
          <div class="suggest-card">
            Ready to see these ideas in action? Head to the <strong>Simulate</strong> tab and
            watch real market history play out with your own pretend shekels.
          </div>
          <button class="run-btn" id="done-back" type="button">Back to courses</button>
        </div>`;
      quizBox.querySelector("#done-back").addEventListener("click", renderHome);
    } else {
      quizBox.innerHTML = `
        <div class="celebrate-wrap">
          <div class="celebrate">🎉</div>
          <h2>Lesson complete!</h2>
          ${gained > 0 ? `<p class="coins-won">+2 coins</p>` : `<p class="cc-done-name">Nicely reviewed.</p>`}
          ${tryItHTML(lesson, "tryit-done")}
          <button class="run-btn ${lesson.tryIt ? "ghost" : ""}" id="done-back" type="button">Back to ${c.title}</button>
        </div>`;
      wireTryIt(lesson, "tryit-done", c.title);
      quizBox.querySelector("#done-back").addEventListener("click", () => renderCourse(c));
    }
  }

  renderHome();
})();
