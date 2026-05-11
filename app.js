// Paste your Google Apps Script web app URL here (see google-apps-script.js for setup)
const CHAMPIONS_SHEET_URL = "https://script.google.com/macros/s/AKfycbw_oep8Lo1f8ec55w0CEzJcgye-YBTQVgJ_nLVdh2HrFZMOvAFfmUAokV2zMdg01P1Y/exec";

const startBtn = document.getElementById("start-btn");
const quizCard = document.getElementById("quiz-card");
const resultCard = document.getElementById("result-card");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const questionText = document.getElementById("question-text");
const questionHint = document.getElementById("question-hint");
const interaction = document.getElementById("interaction");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const scoreTitle = document.getElementById("score-title");
const scoreSummary = document.getElementById("score-summary");
const tipList = document.getElementById("tip-list");
const restartBtn = document.getElementById("restart-btn");
const fxLayer = document.getElementById("fx-layer");

let questions = [];
let currentIndex = 0;
let score = 0;
let locked = false;
let playerName = "";

async function loadQuestions() {
  const response = await fetch("questions.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load quiz questions.");
  }
  questions = await response.json();
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isInfoSlide(type) {
  return type === "factCard" || type === "teamImpact" || type === "nameInput";
}

function getQuestionCount() {
  return questions.filter((q) => !isInfoSlide(q.type)).length;
}

function getQuestionNumber() {
  let count = 0;
  for (let i = 0; i <= currentIndex; i += 1) {
    if (!isInfoSlide(questions[i].type)) {
      count += 1;
    }
  }
  return count;
}

function getMaxScore() {
  let max = 0;
  for (const q of questions) {
    if (q.type === "behaviour") {
      max += Math.max(...q.answers.map((a) => a.score));
    } else if (!isInfoSlide(q.type)) {
      max += 1;
    }
  }
  return max;
}

function resetState() {
  currentIndex = 0;
  score = 0;
  locked = false;
  playerName = "";
  feedback.className = "feedback hidden";
  nextBtn.classList.add("hidden");
  resultCard.classList.add("hidden");
}

function updateProgress() {
  const question = questions[currentIndex];
  const totalQuestions = getQuestionCount();
  const pct = (currentIndex / questions.length) * 100;

  if (question.type === "nameInput") {
    progressText.textContent = "Welcome";
  } else if (question.type === "teamImpact") {
    progressText.textContent = "Team Impact";
  } else if (question.type === "factCard") {
    progressText.textContent = "Fact Card";
  } else {
    const currentNum = getQuestionNumber();
    progressText.textContent = `Question ${currentNum} of ${totalQuestions}`;
  }

  progressFill.style.width = `${pct}%`;
  progressFill.parentElement.setAttribute("aria-valuenow", String(currentIndex));
}

function showFeedback(correct, message) {
  feedback.textContent = message;
  feedback.className = `feedback ${correct ? "success" : "fail"}`;
  nextBtn.classList.remove("hidden");
  progressFill.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  progressFill.parentElement.setAttribute("aria-valuenow", String(currentIndex + 1));
  if (correct) {
    launchConfetti();
  }
}

function launchConfetti() {
  const colors = ["#00DECC", "#00C4B3", "#009e90", "#0A151E", "#4de8dc"];
  for (let i = 0; i < 36; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 220}ms`;
    fxLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 1000);
  }
}


function disableAllActionButtons() {
  interaction.querySelectorAll("button").forEach((btn) => {
    btn.disabled = true;
  });
  interaction.querySelectorAll("select, input").forEach((control) => {
    control.disabled = true;
  });
}

function renderMultipleChoice(question) {
  const answers = shuffle(question.answers);
  answers.forEach((answer) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.textContent = answer.text;

    btn.addEventListener("click", () => {
      if (locked) {
        return;
      }
      locked = true;
      disableAllActionButtons();

      if (answer.correct) {
        score += 1;
        btn.classList.add("correct");
      } else {
        btn.classList.add("wrong");
        const correctText = answers.find((a) => a.correct).text;
        const correctBtn = [...interaction.querySelectorAll("button")]
          .find((item) => item.textContent === correctText);
        if (correctBtn) {
          correctBtn.classList.add("correct");
        }
      }

      showFeedback(answer.correct, answer.explanation);
    });

    interaction.appendChild(btn);
  });
}

function renderBehaviour(question) {
  question.answers.forEach((answer) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.textContent = answer.text;

    btn.addEventListener("click", () => {
      if (locked) {
        return;
      }
      locked = true;
      disableAllActionButtons();

      score += answer.score;
      btn.classList.add("selected");

      feedback.textContent = answer.explanation;
      feedback.className = "feedback success";
      nextBtn.classList.remove("hidden");
      progressFill.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
      progressFill.parentElement.setAttribute("aria-valuenow", String(currentIndex + 1));
      launchConfetti();
    });

    interaction.appendChild(btn);
  });
}

function renderFactCard(question) {
  const card = document.createElement("div");
  card.className = "fact-card-content";

  const icon = document.createElement("span");
  icon.className = "fact-icon";
  icon.textContent = "\uD83D\uDCA1";

  const text = document.createElement("p");
  text.className = "fact-text";
  text.textContent = question.text;

  card.appendChild(icon);
  card.appendChild(text);
  interaction.appendChild(card);

  nextBtn.classList.remove("hidden");
}

function renderNameInput(question) {
  const wrap = document.createElement("div");
  wrap.className = "estimate-wrap";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "estimate-input";
  input.placeholder = question.placeholder || "Your name";
  input.maxLength = 50;

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "btn btn-secondary submit-inline";
  submit.textContent = "Let\u2019s Go!";

  submit.addEventListener("click", () => {
    if (locked) {
      return;
    }
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    locked = true;
    disableAllActionButtons();
    playerName = name;
    nextBtn.classList.remove("hidden");
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submit.click();
    }
  });

  wrap.appendChild(input);
  wrap.appendChild(submit);
  interaction.appendChild(wrap);
}

function renderTeamImpact(question) {
  const wrap = document.createElement("div");
  wrap.className = "team-impact";

  const subtitle = document.createElement("p");
  subtitle.className = "team-impact-subtitle";
  subtitle.textContent = question.subtitle;
  wrap.appendChild(subtitle);

  question.items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "team-impact-row";

    const icon = document.createElement("span");
    icon.className = "team-impact-icon";
    icon.textContent = item.icon;

    const text = document.createElement("span");
    text.className = "team-impact-text";
    text.textContent = item.text;

    row.appendChild(icon);
    row.appendChild(text);
    wrap.appendChild(row);
  });

  const cta = document.createElement("p");
  cta.className = "team-impact-cta";
  cta.textContent = question.cta;
  wrap.appendChild(cta);

  interaction.appendChild(wrap);
  nextBtn.textContent = "See Your Results";
  nextBtn.classList.remove("hidden");
}

function renderEstimation(question) {
  const wrap = document.createElement("div");
  wrap.className = "estimate-wrap";

  const input = document.createElement("input");
  input.type = "number";
  input.className = "estimate-input";
  input.placeholder = question.placeholder || "Enter your estimate";
  input.min = question.min;
  input.max = question.max;

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "btn btn-secondary submit-inline";
  submit.textContent = "Submit Estimate";

  submit.addEventListener("click", () => {
    if (locked) {
      return;
    }

    const value = Number(input.value);
    if (Number.isNaN(value)) {
      showFeedback(false, "Please enter a valid number first.");
      return;
    }

    locked = true;
    disableAllActionButtons();

    const diff = Math.abs(value - question.correctValue);
    const correct = diff <= question.acceptableRange;
    if (correct) {
      score += 1;
    }

    const message = `${question.explanation} Correct value: ${question.correctValue}. Your answer: ${value}.`;
    showFeedback(correct, message);
  });

  wrap.appendChild(input);
  wrap.appendChild(submit);
  interaction.appendChild(wrap);
}

function moveItem(list, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= list.length) {
    return list;
  }
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function renderSorting(question) {
  let currentOrder = shuffle(question.items);

  const list = document.createElement("ul");
  list.className = "sort-list";

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "btn btn-secondary submit-inline";
  submit.textContent = "Submit Order";

  function drawList() {
    list.innerHTML = "";
    currentOrder.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className = "sort-item";

      const label = document.createElement("span");
      label.textContent = `${idx + 1}. ${item}`;

      const controls = document.createElement("div");
      controls.className = "sort-controls";

      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "sort-btn";
      upBtn.textContent = "Up";
      upBtn.disabled = idx === 0 || locked;
      upBtn.addEventListener("click", () => {
        currentOrder = moveItem(currentOrder, idx, -1);
        drawList();
      });

      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "sort-btn";
      downBtn.textContent = "Down";
      downBtn.disabled = idx === currentOrder.length - 1 || locked;
      downBtn.addEventListener("click", () => {
        currentOrder = moveItem(currentOrder, idx, 1);
        drawList();
      });

      controls.appendChild(upBtn);
      controls.appendChild(downBtn);
      li.appendChild(label);
      li.appendChild(controls);
      list.appendChild(li);
    });
  }

  submit.addEventListener("click", () => {
    if (locked) {
      return;
    }
    locked = true;
    disableAllActionButtons();

    const correct = JSON.stringify(currentOrder) === JSON.stringify(question.correctOrder);
    if (correct) {
      score += 1;
    }

    const message = `${question.explanation} Correct order: ${question.correctOrder.join(" -> ")}.`;
    showFeedback(correct, message);
  });

  drawList();
  interaction.appendChild(list);
  interaction.appendChild(submit);
}

function renderQuestion() {
  locked = false;
  feedback.className = "feedback hidden";
  nextBtn.classList.add("hidden");
  nextBtn.textContent = "Next Question";

  const question = questions[currentIndex];
  updateProgress();
  interaction.innerHTML = "";

  if (question.type === "nameInput") {
    questionText.textContent = question.question;
    if (question.hint) {
      questionHint.textContent = question.hint;
      questionHint.classList.remove("hidden");
    } else {
      questionHint.classList.add("hidden");
    }
    renderNameInput(question);
    return;
  }

  if (question.type === "factCard") {
    questionText.textContent = "Did You Know?";
    questionHint.classList.add("hidden");
    renderFactCard(question);
    return;
  }

  if (question.type === "teamImpact") {
    questionText.textContent = question.title;
    questionHint.classList.add("hidden");
    renderTeamImpact(question);
    return;
  }

  questionText.textContent = question.question;

  if (question.hint) {
    questionHint.textContent = question.hint;
    questionHint.classList.remove("hidden");
  } else {
    questionHint.classList.add("hidden");
  }

  if (question.type === "multiple") {
    renderMultipleChoice(question);
    return;
  }

  if (question.type === "behaviour") {
    renderBehaviour(question);
    return;
  }

  if (question.type === "estimation") {
    renderEstimation(question);
    return;
  }

  if (question.type === "sorting") {
    renderSorting(question);
  }
}

function getResultBand(value) {
  if (value >= 9) {
    return {
      key: "champion",
      title: "The Circular Champion",
      summary: "You\u2019re a frontrunner! Your knowledge and awareness keep value in the loop.",
      tips: [
        "\u2705 Become a circularity ambassador for your team",
        "\u2705 Propose one business process that could be more circular"
      ]
    };
  }

  if (value >= 7) {
    return {
      key: "loopBuilder",
      title: "The Loop Builder",
      summary: "You\u2019re already thinking circular \u2014 reuse, repair and sharing are in your DNA.",
      tips: [
        "\u2705 Organize a team reuse/swap event at the office",
        "\u2705 Share your circular choices with colleagues"
      ]
    };
  }

  if (value >= 4) {
    return {
      key: "smartSorter",
      title: "The Smart Sorter",
      summary: "You know the basics, but there\u2019s more to discover about circularity beyond recycling.",
      tips: [
        "\u2705 Repair or get something repaired instead of replacing it",
        "\u2705 Choose refurbished over new for your next purchase"
      ]
    };
  }

  return {
    key: "linearLoser",
    title: "The Linear Loser",
    summary: "Time to brush up \u2014 there\u2019s a whole circular world to discover!",
    tips: [
      "\u2705 Choose one second-hand item this month (clothing, book, electronics)",
      "\u2705 Cycle to work once a week instead of driving"
    ]
  };
}

async function fetchChampions() {
  if (!CHAMPIONS_SHEET_URL) {
    return [];
  }
  try {
    const res = await fetch(CHAMPIONS_SHEET_URL);
    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch {
    return [];
  }
}

async function saveChampion(name, scoreValue) {
  if (!CHAMPIONS_SHEET_URL) {
    return;
  }
  try {
    await fetch(CHAMPIONS_SHEET_URL, {
      method: "POST",
      body: JSON.stringify({ name, score: scoreValue }),
    });
  } catch {
    // silent fail
  }
}

async function showResults() {
  quizCard.classList.add("hidden");
  resultCard.classList.remove("hidden");

  const maxScore = getMaxScore();
  const result = getResultBand(score);

  scoreTitle.textContent = `${score}/${maxScore} \u2014 ${result.title}`;
  scoreSummary.textContent = result.summary;
  tipList.innerHTML = "";

  result.tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    tipList.appendChild(li);
  });

  // Save champion first, then fetch the full list
  if (result.key === "champion" && playerName) {
    await saveChampion(playerName, score);
  }

  const championsWall = document.getElementById("champions-wall");

  if (CHAMPIONS_SHEET_URL) {
    championsWall.classList.remove("hidden");
    championsWall.innerHTML = "";

    const heading = document.createElement("h3");
    heading.className = "champions-heading";
    heading.textContent = "\uD83C\uDFC6 Circular Champions Wall";
    championsWall.appendChild(heading);

    const loading = document.createElement("p");
    loading.className = "champions-loading";
    loading.textContent = "Loading champions\u2026";
    championsWall.appendChild(loading);

    const champions = await fetchChampions();
    loading.remove();

    if (champions.length > 0) {
      const list = document.createElement("ul");
      list.className = "champions-list";
      champions.forEach((c) => {
        const li = document.createElement("li");
        li.className = "champion-entry";
        if (c.name.toLowerCase() === playerName.toLowerCase() && result.key === "champion") {
          li.classList.add("champion-you");
        }
        li.textContent = c.name;
        list.appendChild(li);
      });
      championsWall.appendChild(list);
    } else {
      const empty = document.createElement("p");
      empty.className = "champions-loading";
      empty.textContent = "No champions yet \u2014 be the first!";
      championsWall.appendChild(empty);
    }
  } else {
    championsWall.classList.add("hidden");
  }
}

function handleNext() {
  currentIndex += 1;
  if (currentIndex >= questions.length) {
    showResults();
    return;
  }
  renderQuestion();
}

async function startQuiz() {
  startBtn.disabled = true;
  startBtn.textContent = "Loading...";

  try {
    if (questions.length === 0) {
      await loadQuestions();
    }

    resetState();
    startBtn.classList.add("hidden");
    quizCard.classList.remove("hidden");
    renderQuestion();
  } catch (error) {
    startBtn.disabled = false;
    startBtn.textContent = "Start Quiz";
    alert("Could not load the quiz. Please refresh the page.");
    console.error(error);
  }
}

startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", handleNext);
restartBtn.addEventListener("click", () => {
  resultCard.classList.add("hidden");
  startBtn.classList.remove("hidden");
  startBtn.disabled = false;
  startBtn.textContent = "Start Quiz";
});
