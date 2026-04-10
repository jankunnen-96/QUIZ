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
const countrySlider = document.getElementById("country-slider");
const countryLeft = document.getElementById("country-left");
const countryRight = document.getElementById("country-right");

let questions = [];
let currentIndex = 0;
let score = 0;
let locked = false;
let selectedCountry = "netherlands";

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

function setCountry(value) {
  selectedCountry = value === "1" ? "belgium" : "netherlands";
  countryLeft.classList.toggle("active", selectedCountry === "netherlands");
  countryRight.classList.toggle("active", selectedCountry === "belgium");
}

function resetState() {
  currentIndex = 0;
  score = 0;
  locked = false;
  feedback.className = "feedback hidden";
  nextBtn.classList.add("hidden");
  resultCard.classList.add("hidden");
}

function updateProgress() {
  const current = currentIndex + 1;
  progressText.textContent = `Question ${current} of ${questions.length}`;
  const pct = (currentIndex / questions.length) * 100;
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
  } else {
    showGloom();
  }
}

function launchConfetti() {
  const colors = ["#1f7a5f", "#e59e2e", "#2d8f6f", "#4ab3a2", "#f3ca63"];
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

function showGloom() {
  quizCard.classList.add("shake");
  setTimeout(() => quizCard.classList.remove("shake"), 400);

  const gloom = document.createElement("div");
  gloom.className = "gloom";
  fxLayer.appendChild(gloom);
  setTimeout(() => gloom.remove(), 760);
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

function renderBinQuestion(question) {
  const options = question.binOptions[selectedCountry];
  const grid = document.createElement("div");
  grid.className = "bin-grid";
  const selects = [];

  question.items.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = "bin-item";

    const label = document.createElement("label");
    label.textContent = item;

    const select = document.createElement("select");
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Choose bin";
    select.appendChild(defaultOption);

    options.forEach((opt) => {
      const node = document.createElement("option");
      node.value = opt;
      node.textContent = opt;
      select.appendChild(node);
    });

    wrap.appendChild(label);
    wrap.appendChild(select);
    grid.appendChild(wrap);
    selects.push(select);
  });

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "btn btn-secondary submit-inline";
  submit.textContent = "Submit Bin Choices";

  submit.addEventListener("click", () => {
    if (locked) {
      return;
    }

    const values = selects.map((select) => select.value);
    if (values.some((value) => !value)) {
      showFeedback(false, "Choose a bin for each item before submitting.");
      return;
    }

    locked = true;
    disableAllActionButtons();

    const answers = question.correctByCountry[selectedCountry];
    const allCorrect = question.items.every((item, idx) => values[idx] === answers[item]);
    if (allCorrect) {
      score += 1;
    }

    const solutionText = question.items
      .map((item) => `${item}: ${answers[item]}`)
      .join(" | ");
    const message = `${question.explanation} ${selectedCountry === "netherlands" ? "Netherlands" : "Belgium"} mapping: ${solutionText}.`;
    showFeedback(allCorrect, message);
  });

  interaction.appendChild(grid);
  interaction.appendChild(submit);
}

function renderQuestion() {
  locked = false;
  feedback.className = "feedback hidden";
  nextBtn.classList.add("hidden");

  const question = questions[currentIndex];
  updateProgress();
  questionText.textContent = question.question;
  interaction.innerHTML = "";

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

  if (question.type === "estimation") {
    renderEstimation(question);
    return;
  }

  if (question.type === "sorting") {
    renderSorting(question);
    return;
  }

  if (question.type === "bin") {
    renderBinQuestion(question);
  }
}

function getResultBand(value, total) {
  const ratio = value / total;
  if (ratio >= 0.8) {
    return {
      title: "Circular Economy Champion",
      summary: "You consistently make low-waste choices and understand sorting rules. Your habits are helping cut trash at the source.",
      tips: [
        "Lead a monthly office challenge on refill and reuse habits.",
        "Share your top 3 low-waste swaps with your team.",
        "Push suppliers for less packaging where possible."
      ]
    };
  }

  if (ratio >= 0.5) {
    return {
      title: "Waste-Aware Improver",
      summary: "You are on a strong path with room to sharpen sorting consistency and product choices.",
      tips: [
        "Review bin labels at home and work for one week.",
        "Prioritize reusable options in your top two daily routines.",
        "Replace one short-lifespan item with a durable version."
      ]
    };
  }

  return {
    title: "Waste Reduction Starter",
    summary: "Great first step. Focus on one category this month and your results will improve quickly.",
    tips: [
      "Start with drinks: reusable bottle and mug every day.",
      "Sort tricky items with a local municipality guide nearby.",
      "Choose repair or refill before replacement."
    ]
  };
}

function showResults() {
  quizCard.classList.add("hidden");
  resultCard.classList.remove("hidden");

  const total = questions.length;
  const result = getResultBand(score, total);

  scoreTitle.textContent = `${score}/${total} - ${result.title}`;
  scoreSummary.textContent = result.summary;
  tipList.innerHTML = "";

  result.tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    tipList.appendChild(li);
  });

  localStorage.setItem(
    "trashImpactLastResult",
    JSON.stringify({
      date: new Date().toISOString(),
      score,
      total,
      country: selectedCountry
    })
  );
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

countrySlider.addEventListener("input", (event) => {
  setCountry(event.target.value);
  if (!quizCard.classList.contains("hidden") && questions[currentIndex]?.type === "bin" && !locked) {
    renderQuestion();
  }
});

setCountry(countrySlider.value);
