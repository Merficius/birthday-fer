import { SONGS, QUESTIONS } from './data.js';
import {
  loadSavedRatings,
  saveRatingsToStorage,
  getSavedUsername,
  setSavedUsername,
  getHasExported,
  markAsExported,
  buildExportPayload,
  parseImportPayload,
  triggerDownload,
} from './storage.js';
import { compareData } from './compatibility.js';
import {
  runCalculatingAnimation,
  fireCelebrationConfetti,
  fireHeartKiss,
} from './animation.js';

// App State
let ratingsState = loadSavedRatings();
let currentUserName = getSavedUsername();
let allExpanded = false;

// Card state persistence
const CARD_STATE_KEY = 'kodaline_card_states';
function loadCardStates() {
  try { return JSON.parse(localStorage.getItem(CARD_STATE_KEY)) || {}; }
  catch { return {}; }
}
function saveCardState(songId, expanded) {
  const states = loadCardStates();
  states[songId] = expanded;
  localStorage.setItem(CARD_STATE_KEY, JSON.stringify(states));
}

// DOM Elements
const floatingKitesContainer = document.getElementById('floating-kites-container');
const songsContainer = document.getElementById('songs-container');
const userNameField = document.getElementById('user-name-field');
const btnToggleAllSongs = document.getElementById('btn-toggle-all-songs');
const btnSaveExportBottom = document.getElementById('btn-save-export-bottom');
const btnImportBottom = document.getElementById('btn-import-bottom');
const fileInput = document.getElementById('file-input');
const modalOverlay = document.getElementById('compatibility-modal');
const modalCalculating = document.getElementById('modal-calculating');
const modalResults = document.getElementById('modal-results');
const modalSuspense = document.getElementById('modal-suspense');
const modalOneMoreThing = document.getElementById('modal-one-more-thing');
const btnCloseResults = document.getElementById('btn-close-results');
const revealCardUnopened = document.getElementById('reveal-card-unopened');
const finalErrorCard = document.querySelector('.alarm-error-card');
const btnTriggerReveal = document.getElementById('btn-trigger-reveal');
const hundredPercentCard = document.getElementById('hundred-percent-card');
const animatedHundredNum = document.getElementById('animated-hundred-num');
const amazonUnlockedCard = document.getElementById('amazon-unlocked-card');
const btnAmazonGift = document.getElementById('btn-amazon-gift');
const funnyGiftMessage = document.getElementById('funny-gift-message');
const finalModalActions = document.getElementById('final-modal-actions');
const btnCloseFinal = document.getElementById('btn-close-final');
const btnKissAgain = document.getElementById('btn-kiss-again');
const calcStageText = document.getElementById('calc-stage-text');
const calcProgressFill = document.getElementById('calc-progress-fill');
const calcProgressNum = document.getElementById('calc-progress-num');
const btnKiss = document.getElementById('btn-kiss');
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
const toastIcon = document.getElementById('toast-icon');

// Initialize
function init() {
  generateFloatingKitesOnSides(10);
  initUserName();
  renderSongs();
  setupEventListeners();

  if (getHasExported()) {
    showImportButton();
  }
}

// Generate animated floating kites strictly at the sides (Not behind content)
function generateFloatingKitesOnSides(count) {
  if (!floatingKitesContainer) return;
  floatingKitesContainer.innerHTML = '';

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const kite = document.createElement('div');
    kite.className = 'mini-kite';

    const size = Math.floor(Math.random() * 14) + 20; // 20px to 34px
    const isLeft = i % 2 === 0;
    const left = isLeft ? Math.random() * 9 + 1 : Math.random() * 8 + 90;
    const top = Math.random() * 80 + 8;
    const duration = Math.random() * 8 + 15; // 15s to 23s
    const delay = Math.random() * 6;

    kite.style.setProperty('--kite-size', `${size}px`);
    kite.style.setProperty('--drift-duration', `${duration}s`);
    kite.style.left = `${left}%`;
    kite.style.top = `${top}%`;
    kite.style.animationDelay = `${delay}s`;

    kite.innerHTML = `
      <div class="mini-kite-diamond"></div>
      <div class="mini-kite-string"></div>
    `;

    fragment.appendChild(kite);
  }
  floatingKitesContainer.appendChild(fragment);
}

// User Name Handling
function initUserName() {
  if (userNameField) {
    userNameField.value = currentUserName;
    userNameField.addEventListener('input', (e) => {
      currentUserName = e.target.value.trim() || 'Fer';
      setSavedUsername(currentUserName);
    });
  }
}

// Compute average rating for a single song
function getSongAverage(songId) {
  const ratings = ratingsState[songId] || {};
  let sum = 0;
  let count = 0;
  QUESTIONS.forEach((q) => {
    const val = ratings[q.id] ?? 5.0;
    sum += Number(val);
    count++;
  });
  return count > 0 ? (sum / count).toFixed(1) : '5.0';
}

// Spawn one kite at a time for a smooth trail from the slider thumb.
function spawnSliderKites(wrapper, slider) {
  if (!wrapper || !slider) return;
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 10;
  const val = parseFloat(slider.value) || 0;
  const percent = (val - min) / (max - min);
  const sliderRect = slider.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  const thumbRadius = 10;
  const thumbX = percent * (sliderRect.width - 2 * thumbRadius) + thumbRadius;
  const sliderOffsetLeft = sliderRect.left - wrapperRect.left;
  const sparkle = document.createElement('div');
  sparkle.className = 'slider-kite-sparkle';
  sparkle.style.left = `${sliderOffsetLeft + thumbX}px`;
  sparkle.style.top = `${wrapperRect.height / 2}px`;
  sparkle.style.setProperty('--rand-x', `${(Math.random() - 0.5) * 26}px`);
  sparkle.style.setProperty('--kite-scale', `${0.7 + Math.random() * 0.6}`);
  wrapper.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1450);
}

// Render 12 Separated, Collapsible Song Cards
function renderSongs() {
  if (!songsContainer) return;
  songsContainer.innerHTML = '';

  const savedCardStates = loadCardStates();

  SONGS.forEach((song, idx) => {
    const card = document.createElement('article');
    // Restore saved expanded state; default: first card open
    const isInitiallyExpanded = savedCardStates[song.id] !== undefined
      ? savedCardStates[song.id]
      : idx === 0;
    card.className = `song-card ${isInitiallyExpanded ? 'expanded' : ''}`;
    card.id = `song-card-${song.id}`;

    const avg = getSongAverage(song.id);

    // Clean Track Badge and Header
    const headerHtml = `
      <div class="song-card-header" role="button" aria-expanded="${isInitiallyExpanded}" tabindex="0">
        <div class="song-header-left">
          <div class="track-number-badge">${song.trackNumber}</div>
          <div class="song-title-group">
            <h3>${song.title}</h3>
          </div>
        </div>
        <div class="song-header-right">
          <div class="song-avg-preview" id="avg-preview-${song.id}">
            Promedio: ${avg} / 10
          </div>
          <span class="expand-chevron" aria-hidden="true">▼</span>
        </div>
      </div>
    `;

    // Collapsible Body with 5 Questions
    let questionsHtml = `<div class="song-card-body" id="body-${song.id}"><div class="questions-list">`;
    QUESTIONS.forEach((q) => {
      const val = ratingsState[song.id]?.[q.id] ?? 5.0;
      const formattedVal = Number(val).toFixed(1);

      questionsHtml += `
        <div class="question-row" id="row-${song.id}-${q.id}">
          <div class="question-header">
            <label class="question-label" for="slider-${song.id}-${q.id}">
              <span class="question-icon">${q.icon}</span>
              <span>${q.text}</span>
            </label>
            <div class="number-input-pill">
              <input
                type="number"
                id="num-${song.id}-${q.id}"
                class="rating-number-input"
                min="0"
                max="10"
                step="0.1"
                value="${formattedVal}"
                aria-label="${q.text} calificación numérica"
              />
              <span class="rating-max-label">/ 10</span>
            </div>
          </div>
          <div class="question-description">${q.description}</div>
          <div class="slider-and-inputs">
            <div class="range-slider-wrapper" id="wrapper-${song.id}-${q.id}">
              <input
                type="range"
                id="slider-${song.id}-${q.id}"
                min="0"
                max="10"
                step="0.1"
                value="${formattedVal}"
                aria-label="${q.text} deslizador"
              />
            </div>
          </div>
          <div class="scale-ticks" aria-hidden="true">
            <span>0.0 (buu)</span>
            <span>10.0 (yeei)</span>
          </div>
        </div>
      `;
    });
    questionsHtml += '</div></div>';

    card.innerHTML = headerHtml + questionsHtml;
    songsContainer.appendChild(card);

    // Guaranteed Expand/Collapse on header click (saves state)
    const cardHeader = card.querySelector('.song-card-header');
    function toggleCard(e) {
      if (e) e.stopPropagation();
      const currentlyExpanded = card.classList.contains('expanded');
      if (currentlyExpanded) {
        card.classList.remove('expanded');
        cardHeader.setAttribute('aria-expanded', 'false');
        saveCardState(song.id, false);
      } else {
        card.classList.add('expanded');
        cardHeader.setAttribute('aria-expanded', 'true');
        saveCardState(song.id, true);
      }
      syncToggleAllButton();
    }

    cardHeader.addEventListener('click', toggleCard);
    cardHeader.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(e);
      }
    });
    syncToggleAllButton();

    // Attach sync handlers and kite slider sparkle animation
    QUESTIONS.forEach((q) => {
      const slider = card.querySelector(`#slider-${song.id}-${q.id}`);
      const numInput = card.querySelector(`#num-${song.id}-${q.id}`);
      const wrapper = card.querySelector(`#wrapper-${song.id}-${q.id}`);

      if (slider && numInput) {
        let kiteHoldTimer = null;

        // Keep spawning kites for as long as the slider is held, including at its endpoints.
        const startKiteTrail = () => {
          if (kiteHoldTimer) clearInterval(kiteHoldTimer);
          spawnSliderKites(wrapper, slider);
          kiteHoldTimer = setInterval(() => spawnSliderKites(wrapper, slider), 130);
        };
        const stopKiteTrail = () => {
          if (kiteHoldTimer) clearInterval(kiteHoldTimer);
          kiteHoldTimer = null;
        };
        slider.addEventListener('pointerdown', startKiteTrail);
        window.addEventListener('pointerup', stopKiteTrail);
        window.addEventListener('pointercancel', stopKiteTrail);

        slider.addEventListener('input', () => {
          const raw = parseFloat(slider.value) || 0;
          const clamped = Math.min(10, Math.max(0, Math.round(raw * 10) / 10));
          numInput.value = clamped.toFixed(1);
          updateRatingValue(song.id, q.id, clamped);
          updateHeaderAverage(song.id);

          // The held-pointer trail timer handles kite spawning continuously.
        });

        numInput.addEventListener('input', () => {
          let raw = parseFloat(numInput.value);
          if (isNaN(raw)) return;
          const clamped = Math.min(10, Math.max(0, Math.round(raw * 10) / 10));
          slider.value = clamped;
          updateRatingValue(song.id, q.id, clamped);
          updateHeaderAverage(song.id);
        });

        numInput.addEventListener('blur', () => {
          let raw = parseFloat(numInput.value);
          if (isNaN(raw) || raw < 0) raw = 0;
          if (raw > 10) raw = 10;
          numInput.value = raw.toFixed(1);
          slider.value = raw;
          updateRatingValue(song.id, q.id, raw);
          updateHeaderAverage(song.id);
        });
      }
    });
  });
}

// Update Header Average Rating Badge
function updateHeaderAverage(songId) {
  const preview = document.getElementById(`avg-preview-${songId}`);
  if (preview) {
    const avg = getSongAverage(songId);
    preview.textContent = `Promedio: ${avg} / 10`;
  }
}

// Update State and Persist
function updateRatingValue(songId, qId, value) {
  if (!ratingsState[songId]) {
    ratingsState[songId] = {};
  }
  ratingsState[songId][qId] = value;
  saveRatingsToStorage(ratingsState);
}

// Show Toast Notification
function showToast(message, icon = '✨') {
  if (!toastEl) return;
  toastMsg.textContent = message;
  toastIcon.textContent = icon;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3200);
}

// Reveal Import Button
function showImportButton() {
  if (btnImportBottom) {
    btnImportBottom.style.display = 'inline-flex';
  }
}

// Trigger Save & Export Action
function handleSaveAndExport() {
  saveRatingsToStorage(ratingsState);
  markAsExported();

  const payload = buildExportPayload(ratingsState, currentUserName);
  const jsonStr = JSON.stringify(payload, null, 2);
  const cleanName = currentUserName.toLowerCase().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'calificaciones';
  const filename = `calificaciones_${cleanName}_${Date.now()}.json`;

  triggerDownload(jsonStr, filename);
  showToast('¡Calificaciones guardadas y archivo descargado con éxito!', '💾');
  showImportButton();
}

// Global Expand / Collapse All Songs
function toggleAllCards() {
  const cards = document.querySelectorAll('.song-card');
  allExpanded = !Array.from(cards).every((card) => card.classList.contains('expanded'));
  cards.forEach((card) => {
    const header = card.querySelector('.song-card-header');
    if (allExpanded) {
      card.classList.add('expanded');
      if (header) header.setAttribute('aria-expanded', 'true');
    } else {
      card.classList.remove('expanded');
      if (header) header.setAttribute('aria-expanded', 'false');
    }
    saveCardState(card.id.replace('song-card-', ''), allExpanded);
  });

  syncToggleAllButton();
}

function syncToggleAllButton() {
  const cards = document.querySelectorAll('.song-card');
  allExpanded = cards.length > 0 && Array.from(cards).every((card) => card.classList.contains('expanded'));
  if (btnToggleAllSongs) {
    btnToggleAllSongs.innerHTML = allExpanded
      ? '<span>▲</span> Contraer todas'
      : '<span>▼</span> Expandir todas';
  }
}

// Trigger Suspense with 3-stage cycling messages, then reveal "One More Thing"
function triggerOneMoreThingSurprise() {
  if (btnCloseResults.disabled || modalResults.style.display === 'none') return;
  btnCloseResults.disabled = true;

  // Step 1: Animate results OUT
  modalResults.classList.add('exiting');
  setTimeout(() => {
    modalResults.style.display = 'none';
    modalResults.classList.remove('exiting');

    // Step 2: Show suspense with 3 sequential stages
    const STAGES = [
      '¡Espera!',
      'Algo anda mal...',
      'Se detectó un problema en el algoritmo',
    ];
    const suspenseTitle = modalSuspense.querySelector('.suspense-moment-title');

    let stageIdx = 0;
    suspenseTitle.textContent = STAGES[0];
    suspenseTitle.classList.remove('stage-change');

    modalSuspense.classList.remove('entering', 'exiting');
    void modalSuspense.offsetWidth;
    modalSuspense.style.display = 'block';
    modalOverlay.classList.add('alarm-active');
    modalSuspense.classList.add('entering');

    // Let each uneasy message linger before the next one appears.
    const stageDuration = 1900;
    const stageTimer = setInterval(() => {
      stageIdx++;
      if (stageIdx < STAGES.length) {
        suspenseTitle.classList.remove('stage-change');
        void suspenseTitle.offsetWidth; // reflow
        suspenseTitle.textContent = STAGES[stageIdx];
        suspenseTitle.classList.add('stage-change');
      } else {
        clearInterval(stageTimer);
      }
    }, stageDuration);

    // Step 3: After all stages shown, fade out then reveal One More Thing
    const totalSuspenseTime = STAGES.length * stageDuration + 400;
    setTimeout(() => {
      clearInterval(stageTimer);
      modalSuspense.classList.add('exiting');

      setTimeout(() => {
        modalSuspense.style.display = 'none';
        modalSuspense.classList.remove('exiting', 'entering');
        modalOverlay.classList.remove('alarm-active');
        suspenseTitle.classList.remove('stage-change');

        // Reset reveal state
        revealCardUnopened.style.display = 'block';
        if (finalErrorCard) finalErrorCard.style.display = 'block';
        hundredPercentCard.style.display = 'none';
        amazonUnlockedCard.style.display = 'none';
        if (funnyGiftMessage) funnyGiftMessage.style.display = 'none';
        if (finalModalActions) finalModalActions.style.display = 'none';
        animatedHundredNum.textContent = '0%';
        animatedHundredNum.classList.remove('animate-pop');

        // Animate final view in
        modalOneMoreThing.classList.remove('entering');
        void modalOneMoreThing.offsetWidth;
        modalOneMoreThing.style.display = 'block';
        modalOneMoreThing.classList.add('entering');
      }, 550);
    }, totalSuspenseTime);
  }, 420);
}

// Animate 0% to 100% — single smooth easeOutQuart curve (always decelerating, no phase jumps)
function runHundredPercentAnimation() {
  revealCardUnopened.style.display = 'none';
  if (finalErrorCard) finalErrorCard.style.display = 'none';
  hundredPercentCard.style.display = 'block';

  const duration = 9000; // 9 seconds total for maximum drama
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);

    // Single easeOutQuart: 1 - (1-t)^4
    // Starts fast, continuously decelerates, very slow near 100
    // At t=0.2 (1.8s): ~59%  | t=0.4 (3.6s): ~87%
    // At t=0.6 (5.4s): ~97%  | t=0.8 (7.2s): ~99.8%
    const easedT = 1 - Math.pow(1 - t, 4);
    const current = Math.round(100 * easedT);

    if (current < 100) {
      animatedHundredNum.textContent = `${current}%`;
      requestAnimationFrame(step);
    } else {
      animatedHundredNum.textContent = '100%';
      animatedHundredNum.classList.add('animate-pop');

      fireCelebrationConfetti();
      fireHeartKiss();

      amazonUnlockedCard.style.display = 'block';
      if (finalModalActions) finalModalActions.style.display = 'flex';
    }
  }
  requestAnimationFrame(step);
}

// Event Listeners
function setupEventListeners() {
  if (btnSaveExportBottom) btnSaveExportBottom.addEventListener('click', handleSaveAndExport);

  function openFileDialog() {
    fileInput.value = '';
    fileInput.click();
  }
  if (btnImportBottom) btnImportBottom.addEventListener('click', openFileDialog);

  if (btnToggleAllSongs) {
    btnToggleAllSongs.addEventListener('click', toggleAllCards);
  }

  fileInput.addEventListener('change', handleFileImport);

  // Closing results triggers the Surprise One More Thing sequence!
  if (btnCloseResults) {
    btnCloseResults.addEventListener('click', triggerOneMoreThingSurprise);
  }

  // Backdrop click handling
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) e.stopPropagation();
  });

  // Trigger 0 to 100% Reveal on tap
  if (btnTriggerReveal) {
    btnTriggerReveal.addEventListener('click', runHundredPercentAnimation);
  }

  // Final Close Button
  if (btnCloseFinal) {
    btnCloseFinal.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
      modalOverlay.setAttribute('aria-hidden', 'true');
    });
  }

  // Funny Amazon Gift Button Click (NO toast message)
  if (btnAmazonGift) {
    btnAmazonGift.addEventListener('click', () => {
      if (funnyGiftMessage) {
        funnyGiftMessage.style.display = 'block';
        funnyGiftMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      fireHeartKiss();
    });
  }

  // Kiss Easter Egg
  if (btnKiss) {
    btnKiss.addEventListener('click', () => {
      fireHeartKiss();
      showToast('¡Besito enviado con éxito a tu amorcito!', '😘');
      btnCloseResults.disabled = false;
      btnCloseResults.setAttribute('aria-disabled', 'false');
      btnCloseResults.removeAttribute('title');
      const tooltip = btnCloseResults.closest('.close-results-tooltip');
      tooltip?.removeAttribute('data-tooltip');
      tooltip?.classList.add('tooltip-dismissed');
    });
  }

  if (btnKissAgain) {
    btnKissAgain.addEventListener('click', () => {
      fireHeartKiss();
      showToast('¡Otro besito enviado con amor!', '😘');
    });
  }
}

// Handle File Import & Animation Sequence
async function handleFileImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const importedData = parseImportPayload(text);

    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    modalCalculating.style.display = 'block';
    modalResults.style.display = 'none';
    btnCloseResults.disabled = true;
    btnCloseResults.setAttribute('aria-disabled', 'true');
    btnCloseResults.title = 'Me tienes que dar un besito para que se active este botón.';
    const closeResultsTooltip = btnCloseResults.closest('.close-results-tooltip');
    closeResultsTooltip?.classList.remove('tooltip-dismissed');
    closeResultsTooltip?.setAttribute('data-tooltip', btnCloseResults.title);
    modalSuspense.style.display = 'none';
    modalOneMoreThing.style.display = 'none';
    if (funnyGiftMessage) funnyGiftMessage.style.display = 'none';

    await runCalculatingAnimation({
      onStageChange: ({ text }) => {
        calcStageText.textContent = text;
      },
      onProgressUpdate: (progress) => {
        calcProgressFill.style.width = `${progress}%`;
        calcProgressNum.textContent = progress;
      },
    });

    const comparison = compareData(
      ratingsState,
      importedData.ratings,
      currentUserName,
      importedData.userName
    );

    displayComparisonResults(comparison);

    modalCalculating.style.display = 'none';
    modalResults.style.display = 'block';
    fireCelebrationConfetti();

  } catch (err) {
    console.error('Error importing file:', err);
    alert('No se pudo importar el archivo: ' + err.message);
  }
}

// Display Comparison Results
function displayComparisonResults(comp) {
  const scoreValAEl = document.getElementById('final-score-a');
  const scoreValBEl = document.getElementById('final-score-b');
  const scoreNameAEl = document.getElementById('final-score-name-a');
  const scoreNameBEl = document.getElementById('final-score-name-b');
  const comparisonNamesEl = document.getElementById('results-comparison-names');
  const generosityBannerEl = document.getElementById('generosity-banner');
  const questionInsightsEl = document.getElementById('question-insights');
  const labelFavA = document.getElementById('label-fav-a');
  const valFavA = document.getElementById('val-fav-a');
  const labelFavB = document.getElementById('label-fav-b');
  const valFavB = document.getElementById('val-fav-b');
  const valBestSong = document.getElementById('val-best-song');
  const valDebateSong = document.getElementById('val-debate-song');

  scoreValAEl.textContent = comp.overallScoreA.toFixed(1);
  scoreValBEl.textContent = comp.overallScoreB.toFixed(1);
  scoreNameAEl.textContent = `Compatibilidad de ${comp.nameA}`;
  scoreNameBEl.textContent = `Compatibilidad de ${comp.nameB}`;
  comparisonNamesEl.textContent = `${comp.nameA} & ${comp.nameB}`;

  // Meaningful Names in Action
  generosityBannerEl.textContent = comp.generosityInsight.startsWith('❤️')
    ? comp.generosityInsight
    : `❤️ ${comp.generosityInsight}`;
  questionInsightsEl.replaceChildren();
  (comp.questionInsights || []).forEach((insight) => {
    const item = document.createElement('p');
    item.textContent = insight;
    questionInsightsEl.appendChild(item);
  });
  labelFavA.textContent = `Favorita de ${comp.nameA}`;
  valFavA.textContent = `${comp.favSongA.title} (${comp.favSongA.score} ★)`;
  labelFavB.textContent = `Favorita de ${comp.nameB}`;
  valFavB.textContent = `${comp.favSongB.title} (${comp.favSongB.score} ★)`;

  if (comp.bestSong) {
    valBestSong.textContent = `${comp.bestSong.title} (${comp.bestSong.avgScore}%)`;
  }
  if (comp.debateSong) {
    valDebateSong.textContent = `${comp.debateSong.title} (${comp.debateSong.avgScore}%)`;
  }

  // Questions Summary
  const qListEl = document.getElementById('questions-summary-list');
  qListEl.innerHTML = '';
  comp.questionSummaries.forEach((q) => {
    const row = document.createElement('div');
    row.style.marginBottom = '0.75rem';
    const scoreSummary = q.id === 'q5'
      ? `<span style="font-family: var(--font-mono); color: var(--kite-blue); font-weight: 700;">${comp.nameA} predijo a ${comp.nameB}: ${q.averageScoreA.toFixed(0)}% · ${comp.nameB} predijo a ${comp.nameA}: ${q.averageScoreB.toFixed(0)}%</span>`
      : `<span style="font-family: var(--font-mono); color: var(--kite-blue); font-weight: 700;">${q.averageScore.toFixed(0)}%</span>`;
    row.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.25rem;">
        <span>${q.icon} <strong>${q.text}</strong></span>
        ${scoreSummary}
      </div>
      ${q.id === 'q5'
        ? `<div style="display: flex; gap: 0.3rem;">
            <div title="${comp.nameA}: ${q.averageScoreA}%" style="width: 50%; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;"><div style="width: ${q.averageScoreA}%; height: 100%; background: #334155;"></div></div>
            <div title="${comp.nameB}: ${q.averageScoreB}%" style="width: 50%; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;"><div style="width: ${q.averageScoreB}%; height: 100%; background: #dc2626;"></div></div>
          </div>`
        : `<div style="height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;"><div style="width: ${q.averageScore}%; height: 100%; background: #334155; border-radius: 99px;"></div></div>`}
    `;
    qListEl.appendChild(row);
  });

  // Song Breakdowns WITH ALL 5 QUESTIONS INCLUDED
  const songContainer = document.getElementById('song-breakdowns-container');
  songContainer.innerHTML = '';

  comp.songBreakdowns.forEach((sb) => {
    const card = document.createElement('div');
    card.className = 'song-breakdown-card';

    let qRows = '';
    sb.questions.forEach((q) => {
      const ratingDetails = q.questionId === 'q5'
        ? `${q.valA} (real: ${q.actualB}) · ${q.valB} (real: ${q.actualA})`
        : `(${comp.nameA}: ${q.valA} | ${comp.nameB}: ${q.valB})`;
      const scoreDisplay = q.questionId === 'q5'
        ? `${comp.nameA}: ${q.predictionScoreA}% · ${comp.nameB}: ${q.predictionScoreB}%`
        : `${q.score}%`;
      qRows += `
        <div class="breakdown-q-row">
          <span class="breakdown-q-name">${q.icon} ${q.shortLabel}</span>
          <div style="display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
            <span class="breakdown-q-score">${scoreDisplay}</span>
            <span class="breakdown-q-ratings">${ratingDetails}</span>
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="song-breakdown-header">
        <span class="song-breakdown-title">#${sb.trackNumber} ${sb.title}</span>
        <span class="song-breakdown-badge">${sb.avgScore}%</span>
      </div>
      <div class="song-breakdown-questions">
        ${qRows}
      </div>
    `;
    songContainer.appendChild(card);
  });
}

// Start
init();
