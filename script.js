(function () {
  "use strict";

  // Estado
  let questions = [];      // [{question, options:[{text, correct}]}]
  let order = [];           // índices en orden aleatorio
  let currentIndex = 0;
  let answerShown = false;

  // Referencias DOM
  const screenStart = document.getElementById("screen-start");
  const screenGame = document.getElementById("screen-game");
  const screenEnd = document.getElementById("screen-end");

  const inputQuestions = document.getElementById("input-questions");
  const errorMessage = document.getElementById("error-message");

  const questionText = document.getElementById("question-text");
  const optionsList = document.getElementById("options-list");

  const btnRestart = document.getElementById("btn-restart");
  const btnMainAction = document.getElementById("btn-main-action");

  // Estados posibles de la app: 'start' | 'game' | 'end'
  let appState = "start";

  function showScreen(name) {
    screenStart.classList.remove("active");
    screenGame.classList.remove("active");
    screenEnd.classList.remove("active");

    if (name === "start") screenStart.classList.add("active");
    if (name === "game") screenGame.classList.add("active");
    if (name === "end") screenEnd.classList.add("active");

    appState = name;
    updateMainActionButton();
  }

  function updateMainActionButton() {
    if (appState === "start") {
      btnMainAction.textContent = "Comenzar";
      btnRestart.classList.add("hidden");
    } else if (appState === "game") {
      btnMainAction.textContent = answerShown ? "Siguiente pregunta" : "Mostrar respuesta";
      btnRestart.classList.remove("hidden");
    } else if (appState === "end") {
      btnMainAction.textContent = "Volver a empezar";
      btnRestart.classList.add("hidden");
    }
  }

  // Parseo del texto plano a preguntas
  function parseQuestions(raw) {
    const blocks = raw
      .split(/\n\s*\n/)
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const result = [];

    for (const block of blocks) {
      const lines = block.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) continue;

      const questionLine = lines[0];
      const optionLines = lines.slice(1);

      const options = [];
      for (const line of optionLines) {
        const isCorrect = line.startsWith("*");
        const isNormal = line.startsWith("-");
        if (!isCorrect && !isNormal) continue;
        const text = line.slice(1).trim();
        if (!text) continue;
        options.push({ text, correct: isCorrect });
      }

      const correctCount = options.filter(o => o.correct).length;

      if (options.length === 4 && correctCount === 1 && questionLine.length > 0) {
        result.push({ question: questionLine, options });
      }
    }

    return result;
  }

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startGame() {
    const raw = inputQuestions.value;
    const parsed = parseQuestions(raw);

    if (parsed.length === 0) {
      errorMessage.textContent = "No se encontró ninguna pregunta válida. Revisa el formato e inténtalo de nuevo.";
      return;
    }

    errorMessage.textContent = "";
    questions = parsed;
    order = shuffle(questions.map((_, i) => i));
    currentIndex = 0;
    answerShown = false;

    showScreen("game");
    renderQuestion();
  }

  function renderQuestion() {
    const q = questions[order[currentIndex]];
    questionText.textContent = q.question;

    optionsList.innerHTML = "";
    q.options.forEach(opt => {
      const div = document.createElement("div");
      div.className = "option";
      div.textContent = opt.text;
      if (opt.correct) div.dataset.correct = "true";
      optionsList.appendChild(div);
    });

    answerShown = false;
    updateMainActionButton();
  }

  function showAnswer() {
    const correctEl = optionsList.querySelector('[data-correct="true"]');
    if (correctEl) correctEl.classList.add("correct");
    answerShown = true;
    updateMainActionButton();
  }

  function nextQuestion() {
    currentIndex++;
    if (currentIndex >= order.length) {
      showScreen("end");
    } else {
      renderQuestion();
    }
  }

  function restart() {
    showScreen("start");
    errorMessage.textContent = "";
  }

  // Acción principal según el estado actual
  function handleMainAction() {
    if (appState === "start") {
      startGame();
    } else if (appState === "game") {
      if (!answerShown) {
        showAnswer();
      } else {
        nextQuestion();
      }
    } else if (appState === "end") {
      restart();
    }
  }

  btnMainAction.addEventListener("click", handleMainAction);
  btnRestart.addEventListener("click", restart);

  // Enter para avanzar el flujo, evitando conflicto con el textarea multilinea
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;

    // Si el foco está en el textarea, no interceptamos Enter (para permitir saltos de línea)
    // salvo que se use Ctrl/Cmd+Enter como acceso rápido para comenzar.
    if (document.activeElement === inputQuestions) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleMainAction();
      }
      return;
    }

    e.preventDefault();
    handleMainAction();
  });

  // Inicio
  showScreen("start");
})();
