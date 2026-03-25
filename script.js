// --- STATE ---
let musicPlaying = false;
let wavesurfer = null;

// --- GUEST DATA ---
let guestsArray = [];
let quizScoreboard = [];

async function loadGuestsData() {
  try {
    const res = await fetch('data/guests.csv');
    if (!res.ok) throw new Error("No CSV");
    const txt = await res.text();
    const lines = txt.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(';');
      if (parts.length >= 2) {
        const fullName = (parts[0].trim() + " " + parts[1].trim());
        guestsArray.push(fullName);
        // Create demo scoreboard
        if (i % 2 === 0 && i < 15) {
          quizScoreboard.push({ name: fullName, score: Math.floor(Math.random() * 4) + 1 });
        }
      }
    }
    quizScoreboard.sort((a, b) => b.score - a.score);
    populateScoreboard();
  } catch (err) {
    console.error("Guests CSV not found, using mockup data.");
    guestsArray = ["Antonella Rossi", "Mauro Bianchi", "Giulia Verdi", "Marco Rossi"];
    quizScoreboard = [{ name: "Marco Rossi", score: 5 }, { name: "Giulia Verdi", score: 4 }];
    populateScoreboard();
  }
}

// --- INITIALIZATION (WAX SEAL) ---
function openInvite() {
  const envelopeWrap = document.getElementById("envelope");
  const sealBtn = document.getElementById("seal-btn");
  const flap = document.getElementById("env-flap");
  const letter = document.getElementById("letter-mock");
  const main = document.getElementById("main");
  const audioPlayer = document.getElementById("audio-player");

  // Step 1: Flap & Seal open with 3D animation
  if (flap) flap.classList.add("open");
  if (sealBtn) sealBtn.classList.add("open");

  // Step 2: Letter slides up from inside
  setTimeout(() => {
    if (letter) letter.classList.add("open");

    // Step 3: Fade out envelope wrapper to reveal content
    setTimeout(() => {
      envelopeWrap.style.opacity = '0';

      setTimeout(() => {
        envelopeWrap.style.display = 'none';
        main.classList.remove("hidden");

        // Show Audio Player with smooth slide down
        setTimeout(() => {
          audioPlayer.classList.remove("hidden");
          const nav = document.getElementById("bottom-nav");
          if (nav) nav.classList.remove("hidden");
        }, 500);

        // Scrolling is now handled directly via CSS in #main
        main.scrollIntoView({ behavior: 'smooth', block: 'start' });

        startCountdown();
        startPetals();
        initScrollObservers();
        initExplicitGallery();

        // Play music
        if (!musicPlaying && wavesurfer) {
          wavesurfer.play();
          musicPlaying = true;
          document.getElementById("icon-play").style.display = "none";
          document.getElementById("icon-pause").style.display = "block";
        }
      }, 500);
    }, 1200);
  }, 600);
}

// --- PREVENT SCROLL BEFORE OPENING & BIND EVENTS & WAVESURFER ---
document.addEventListener("DOMContentLoaded", () => {
  document.body.style.overflowY = 'hidden';
  window.scrollTo(0, 0);

  loadGuestsData();
  loadAllQuestions();

  // SETUP WAVESURFER OBBLIGATORIO
  wavesurfer = WaveSurfer.create({
    container: '#waveform',

    waveColor: '#d4a373',
    progressColor: '#9F8672',

    height: 30,

    barWidth: 1,
    barGap: 1,
    cursorWidth: 1,
    barRadius: 4,

    minPxPerSec: 10,

    normalize: true,
    responsive: false,
  });
  wavesurfer.load('assets/Thinking Out Loud - Ed Sheeran.mp3');

  wavesurfer.on('ready', () => {
    document.getElementById('audio-total').innerText = formatTime(wavesurfer.getDuration());
  });

  wavesurfer.on('audioprocess', () => {
    document.getElementById('audio-current').innerText = formatTime(wavesurfer.getCurrentTime());
  });

  wavesurfer.on('seek', () => {
    document.getElementById('audio-current').innerText = formatTime(wavesurfer.getCurrentTime());
  });

  wavesurfer.on('finish', () => {
    wavesurfer.seekTo(0);
    wavesurfer.play();
  });

  const sealBtn = document.getElementById("seal-btn");
  const audio = document.getElementById("music");

  if (sealBtn && audio) {
    sealBtn.addEventListener("click", () => {

      // audio.play().then(() => {
      //   audio.volume = 0; // Evitiamo doppio audio sovrapposto
      // }).catch(err => console.error("Errore audio nativo:", err));

      wavesurfer.play().then(() => {
        console.log("Audio partito");
        musicPlaying = true;
        updateAudioUI();
      }).catch(err => {
        console.error("Errore WaveSurfer audio:", err);
      });

      openInvite();
    });
  } else {
    console.error("Sigillo o audio non trovati nel DOM");
  }
});

// --- TYPEWRITER WELCOME ---
function typewriterEffect() {
  const text = "È proprio vero,\nci sposiamo!!!";
  const el = document.getElementById("typewriter-text");
  let i = 0;
  el.innerHTML = "";

  const type = () => {
    if (i < text.length) {
      if (text.charAt(i) === '\n') {
        el.innerHTML += "<br>";
      } else {
        el.innerHTML += text.charAt(i);
      }
      i++;
      setTimeout(type, 80);
    }
  };
  setTimeout(type, 500); // delay after reveal
}

function toggleMusic() {
  if (!wavesurfer) return;

  if (wavesurfer.isPlaying()) {
    wavesurfer.pause();
    musicPlaying = false;
  } else {
    wavesurfer.play();
    musicPlaying = true;
  }
  updateAudioUI();
}

function updateAudioUI() {
  const playIcon = document.getElementById("icon-play");
  const pauseIcon = document.getElementById("icon-pause");

  if (musicPlaying) {
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
  } else {
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
}

function setActiveTab(el) {
  const tabs = document.querySelectorAll(".tab-item");
  tabs.forEach(tab => tab.classList.remove("active"));
  el.classList.add("active");
}

function handleAutocomplete(input, listId) {
  const val = input.value.toLowerCase();
  const list = document.getElementById(listId);
  list.innerHTML = "";
  if (!val) { list.classList.remove("show"); return; }

  const matches = guestsArray.filter(g => g.toLowerCase().includes(val));
  if (matches.length > 0) {
    matches.forEach(match => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      const start = match.toLowerCase().indexOf(val);
      const highlighted = match.substring(0, start) + "<strong>" + match.substring(start, start + val.length) + "</strong>" + match.substring(start + val.length);
      div.innerHTML = highlighted;
      div.onmousedown = function (e) {
        input.value = match;
        list.classList.remove("show");
      };
      list.appendChild(div);
    });
    list.classList.add("show");
  } else {
    list.classList.remove("show");
  }
}

function blurAutocomplete(listId) {
  setTimeout(() => {
    const list = document.getElementById(listId);
    if (list) list.classList.remove("show");
  }, 150);
}

// --- HORIZONTAL COUNTDOWN WITH SECONDS ---
function startCountdown() {
  const targetDate = new Date("2026-10-05T11:00:00").getTime();

  const updateTimer = () => {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      document.getElementById("countdown").innerHTML = "<h3 style='font-family: var(--font-serif); font-size: 2.5rem; color: var(--primary-dark);'>Oggi è il nostro giorno!</h3>";
      return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById("days");
    if (daysEl) {
      daysEl.innerText = d < 10 ? '0' + d : d;
      document.getElementById("hours").innerText = h < 10 ? '0' + h : h;
      document.getElementById("minutes").innerText = m < 10 ? '0' + m : m;
      document.getElementById("seconds").innerText = s < 10 ? '0' + s : s;
    }
  };
  updateTimer();
  setInterval(updateTimer, 1000); // Ticking every second
}

// --- NARRATIVE MAP OBSERVERS & ACTIVE NAVIGATION ---
function initScrollObservers() {
  const genericObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        genericObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px", threshold: 0.1 });

  document.querySelectorAll(".fade-up").forEach(el => genericObserver.observe(el));

  // Sync scroll with bottom tab bar Active State
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        document.querySelectorAll('.tab-item').forEach(tab => {
          tab.classList.remove('active');
          if (tab.getAttribute('href') === '#' + id) {
            tab.classList.add('active');
          }
        });
      }
    });
  }, { root: document.getElementById('main'), rootMargin: "-40% 0px -50% 0px" });

  document.querySelectorAll('section').forEach(sec => navObserver.observe(sec));
}

window.setActiveTab = function (clickedTab, event) {
  if (event) event.preventDefault();
  document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
  if (clickedTab) clickedTab.classList.add('active');

  const targetId = clickedTab.getAttribute('href').substring(1);
  const targetSec = document.getElementById(targetId);
  const main = document.getElementById('main');

  if (targetSec && main) {
    const startY = main.scrollTop;

    // Rispetta lo scroll-margin-top impostato via CSS
    const styleAttr = window.getComputedStyle(targetSec);
    const scrollMarginTop = parseInt(styleAttr.scrollMarginTop) || 0;

    const targetY = targetSec.offsetTop - scrollMarginTop;
    const distance = targetY - startY;
    const duration = 350; // Custom speed
    let start = null;

    window.requestAnimationFrame(function step(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const easeInOutCubic = progress < duration / 2
        ? 4 * Math.pow(progress / duration, 3)
        : 1 - Math.pow(-2 * progress / duration + 2, 3) / 2;

      main.scrollTop = startY + distance * easeInOutCubic;

      if (progress < duration) {
        window.requestAnimationFrame(step);
      } else {
        main.scrollTop = targetY;
      }
    });
  }
};

// --- DYNAMIC GALLERY ---
function initExplicitGallery() {
  const container = document.getElementById('galleryContainer');
  const dotsContainer = document.getElementById('gallery-dots');
  if (!container) return;

  const images = ["assets/images/09caf564-f9a8-4923-b17f-b6b7ca4daca5.jpg", "assets/images/1.jpg", "assets/images/20171209_172955.jpg", "assets/images/3.jpg", "assets/images/3fe22d62-5dba-4d47-a47e-bd315beacede.jpg", "assets/images/4.jpg", "assets/images/7202c811-e88e-4341-accd-fba18ddee299.jpg", "assets/images/75aea258-9415-407d-8a76-b9383efc61f4.jpg", "assets/images/7cdc9428-3a47-4212-be3c-bbd406005cac.jpg", "assets/images/IMG-20191101-WA0011.jpg", "assets/images/IMG-20221009-WA0184.jpg", "assets/images/IMG-20230101-WA0035.jpg", "assets/images/IMG-20230226-WA0000.jpg", "assets/images/IMG-20230226-WA0001.jpg", "assets/images/IMG_0282.HEIC", "assets/images/IMG_0352.HEIC", "assets/images/IMG_0474.HEIC", "assets/images/IMG_0479.HEIC", "assets/images/IMG_0486.HEIC", "assets/images/IMG_0488.HEIC", "assets/images/IMG_0496.HEIC", "assets/images/IMG_0508.HEIC", "assets/images/IMG_0528.HEIC", "assets/images/IMG_0542.HEIC", "assets/images/IMG_0630.HEIC", "assets/images/IMG_0692.HEIC", "assets/images/IMG_0693.HEIC", "assets/images/IMG_0694.HEIC", "assets/images/IMG_0756.HEIC", "assets/images/IMG_1075.HEIC", "assets/images/IMG_1094.HEIC", "assets/images/IMG_1622.HEIC", "assets/images/IMG_1654.HEIC", "assets/images/IMG_20190223_155855.jpg", "assets/images/IMG_20190223_161153.jpg", "assets/images/IMG_20190223_175007.jpg", "assets/images/IMG_20190224_153317.jpg", "assets/images/IMG_20190224_162820.jpg", "assets/images/IMG_20190303_163420.jpg", "assets/images/IMG_20191103_121436.jpg", "assets/images/IMG_20200809_192419.jpg", "assets/images/IMG_20210313_150259.jpg", "assets/images/IMG_20210313_150316.jpg", "assets/images/IMG_20210729_195638.jpg", "assets/images/IMG_20210729_200115.jpg", "assets/images/IMG_20210729_200159.jpg", "assets/images/IMG_20211031_130857.jpg", "assets/images/IMG_20211208_124056.jpg", "assets/images/IMG_20220106_161934.jpg", "assets/images/IMG_20220603_094950.jpg", "assets/images/IMG_20220603_104852.jpg", "assets/images/IMG_20220709_230224.jpg", "assets/images/IMG_20220731_170018.jpg", "assets/images/IMG_20220809_153902.jpg", "assets/images/IMG_20220809_202319.jpg", "assets/images/IMG_20220809_202329.jpg", "assets/images/IMG_20220809_202340.jpg", "assets/images/IMG_20220809_202433.jpg", "assets/images/IMG_20220809_202527.jpg", "assets/images/IMG_20220809_202544.jpg", "assets/images/IMG_20220812_135624.jpg", "assets/images/IMG_20220812_230221.jpg", "assets/images/IMG_20220812_235700.jpg", "assets/images/IMG_20220813_123552.jpg", "assets/images/IMG_20220813_125225.jpg", "assets/images/IMG_20220813_125927.jpg", "assets/images/IMG_20220813_165437.jpg", "assets/images/IMG_20220813_171708.jpg", "assets/images/IMG_20220813_173857.jpg", "assets/images/IMG_20220814_154154.jpg", "assets/images/IMG_20220815_164121.jpg", "assets/images/IMG_20220816_064357.jpg", "assets/images/IMG_20220816_121324.jpg", "assets/images/IMG_20220816_142406.jpg", "assets/images/IMG_20220817_191727.jpg", "assets/images/IMG_20220817_191755.jpg", "assets/images/IMG_20221008_222458.jpg", "assets/images/IMG_20221016_152235.jpg", "assets/images/IMG_20221029_182820.jpg", "assets/images/IMG_20221203_210504.jpg", "assets/images/IMG_20221211_125153.jpg", "assets/images/IMG_20221231_212322.jpg", "assets/images/IMG_20230218_182054.jpg", "assets/images/IMG_20230218_192246.jpg", "assets/images/IMG_2179.HEIC", "assets/images/IMG_2381.HEIC", "assets/images/IMG_2405.HEIC", "assets/images/IMG_2406.HEIC", "assets/images/IMG_2469.HEIC", "assets/images/IMG_2476.HEIC", "assets/images/IMG_2483.HEIC", "assets/images/IMG_2507.HEIC", "assets/images/IMG_2515.HEIC", "assets/images/IMG_2530.HEIC", "assets/images/IMG_2548.HEIC", "assets/images/IMG_2622.HEIC", "assets/images/IMG_2648.HEIC", "assets/images/IMG_2762.HEIC", "assets/images/IMG_3062.HEIC", "assets/images/IMG_3242.HEIC", "assets/images/IMG_3404.HEIC", "assets/images/IMG_3416.HEIC", "assets/images/IMG_3454.HEIC", "assets/images/IMG_3467.HEIC", "assets/images/IMG_3487.HEIC", "assets/images/IMG_3505.HEIC", "assets/images/IMG_3555.HEIC", "assets/images/IMG_3576.HEIC", "assets/images/IMG_4116.HEIC", "assets/images/IMG_4130.HEIC", "assets/images/IMG_4135.HEIC", "assets/images/IMG_4143.HEIC", "assets/images/IMG_4152.HEIC", "assets/images/IMG_4166.HEIC", "assets/images/IMG_4170.HEIC", "assets/images/IMG_4201.HEIC", "assets/images/IMG_4235.HEIC", "assets/images/IMG_4264.HEIC", "assets/images/IMG_4518.HEIC", "assets/images/IMG_4667.HEIC", "assets/images/IMG_4764.HEIC", "assets/images/IMG_4949.HEIC", "assets/images/IMG_4964.HEIC", "assets/images/IMG_4965.HEIC", "assets/images/IMG_5005.HEIC", "assets/images/IMG_5027.HEIC", "assets/images/IMG_5029.HEIC", "assets/images/IMG_5040.HEIC", "assets/images/IMG_5066.HEIC", "assets/images/IMG_5105.HEIC", "assets/images/IMG_5139.HEIC", "assets/images/IMG_5141.HEIC", "assets/images/IMG_5535.HEIC", "assets/images/IMG_5537.HEIC", "assets/images/IMG_5550.HEIC", "assets/images/IMG_5555.HEIC", "assets/images/IMG_5571.HEIC", "assets/images/IMG_5579.HEIC", "assets/images/IMG_5591.HEIC", "assets/images/IMG_5593.HEIC", "assets/images/IMG_5594.HEIC", "assets/images/IMG_5610.HEIC", "assets/images/IMG_5616.HEIC", "assets/images/IMG_5756.HEIC", "assets/images/IMG_5767.HEIC", "assets/images/IMG_5770.HEIC", "assets/images/IMG_5784.HEIC", "assets/images/IMG_5796.HEIC", "assets/images/IMG_5848.HEIC", "assets/images/IMG_5865.HEIC", "assets/images/IMG_5905.HEIC", "assets/images/IMG_5965.HEIC", "assets/images/IMG_5969.HEIC", "assets/images/IMG_5977.HEIC", "assets/images/IMG_6039.HEIC", "assets/images/IMG_6090.HEIC", "assets/images/IMG_6095.HEIC", "assets/images/IMG_6102.HEIC", "assets/images/IMG_6105.HEIC", "assets/images/IMG_6109.HEIC", "assets/images/IMG_6114.HEIC", "assets/images/ca8282d6-277a-4add-9046-c344fc0a0736.jpg"];
  let index = 0;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active-snap');
        // Update dots
        if (dotsContainer) {
          const children = Array.from(container.children);
          const idx = children.indexOf(entry.target);
          const dots = dotsContainer.querySelectorAll('.gallery-dot');
          dots.forEach(d => d.classList.remove('active'));
          if (dots[idx]) dots[idx].classList.add('active');
        }
      } else {
        entry.target.classList.remove('active-snap');
      }
    });
  }, { root: container, threshold: 0.6 });

  images.forEach((src) => {
    const img = new Image();
    img.src = src;
    img.loading = "lazy";

    img.onerror = function () {
      this.parentElement.style.display = 'none';
      observer.unobserve(this.parentElement);
    };

    const item = document.createElement("div");
    item.className = "gallery-item";

    img.onclick = () => openLightbox(img.src);
    item.appendChild(img);

    container.appendChild(item);
    observer.observe(item);

    // Create dot
    if (dotsContainer) {
      const dot = document.createElement("div");
      dot.className = "gallery-dot";
      const currIdx = index++;
      dot.onclick = () => {
        const children = container.querySelectorAll('.gallery-item');
        if (children[currIdx]) children[currIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      };
      dotsContainer.appendChild(dot);
    }
  });
}

function scrollGallery(dir) {
  const container = document.getElementById("galleryContainer");
  if (container) {
    // Get width of one item approximately
    const itemWidth = container.querySelector('.gallery-item') ? container.querySelector('.gallery-item').offsetWidth : 300;
    container.scrollBy({ left: dir * itemWidth, behavior: 'smooth' });
  }
}

function openLightbox(src) {
  const lb = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = src;
  lb.classList.add("show");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("show");
}

// --- ADVANCED QUIZ UX ---
const quizData = [
  { q: "Qual è stata la nostra prima vacanza insieme?", opts: ["Barcellona", "Sicilia", "Puglia", "Roma"], ans: 2 },
  { q: "Chi ha detto 'Ti amo' per primo?", opts: ["Antonella", "Mauro", "Insieme nello stesso momento", "Nessuno se lo ricorda"], ans: 1 },
  { q: "Qual è il piatto forte di Mauro?", opts: ["Carbonara", "Lasagne", "Risotto ai funghi", "Nessuno, sa solo ordinare su Glovo"], ans: 0 },
  { q: "Dove è avvenuta la proposta di matrimonio?", opts: ["Al ristorante", "Ad un concerto", "A casa nostra", "In montagna durante un'escursione"], ans: 1 }
];
let currentQ = 0;
let quizScore = 0;
let quizUser = "";
let userAnswers = {};

function loadAllQuestions() {
  const container = document.getElementById("quiz-questions-list");
  if (!container) return;

  const labels = ["A) ", "B) ", "C) ", "D) "];
  let html = "";
  quizData.forEach((qObj, qIdx) => {
    html += `<div class="quiz-q-block" style="margin-bottom:30px; background: rgba(212,163,115,0.05); border-radius: 12px; padding: 20px;">
        <h3 class="quiz-question" style="margin-bottom: 20px; font-size: 1.15rem;">${qIdx + 1}. ${qObj.q}</h3>
        <div class="quiz-options-grid" id="opts-${qIdx}">`;
    qObj.opts.forEach((opt, idx) => {
      html += `<button class="quiz-btn" onclick="selectQuizAnswer(${qIdx}, ${idx}, this)">${labels[idx]}${opt}</button>`;
    });
    html += `</div></div>`;
  });
  container.innerHTML = html;
}

function selectQuizAnswer(qIdx, optIdx, btn) {
  userAnswers[qIdx] = optIdx;
  const allBtns = btn.parentElement.querySelectorAll('.quiz-btn');
  allBtns.forEach(b => { b.style.background = ''; b.style.color = ''; b.style.borderColor = ''; });
  btn.style.background = 'var(--primary-color)';
  btn.style.color = '#fff';
}

async function submitFullQuiz() {
  const fullname = document.getElementById("quiz-username").value.trim();
  if (!fullname) { showToast("Inserisci il tuo nome dalla lista prima di inviare!"); return; }
  let found = guestsArray.some(g => g.toLowerCase() === fullname.toLowerCase());
  if (!found) { showToast("Spiacenti, nome non in lista."); return; }

  if (Object.keys(userAnswers).length < quizData.length) { showToast("Rispondi a tutte le domande per continuare!"); return; }

  let score = 0;
  quizData.forEach((q, idx) => { if (userAnswers[idx] === q.ans) score++; });
  quizScore = score;
  quizUser = fullname;

  try {
    const [nome, ...cognomeArr] = fullname.split(' ');
    const cognome = cognomeArr.join(' ');

    const formData = new URLSearchParams();
    formData.append('action', 'quiz');
    formData.append('nome', nome || '');
    formData.append('cognome', cognome || '');
    formData.append('score', score);

    await fetch('api.php', {
      method: 'POST',
      body: formData
    });
  } catch (e) { }

  // Update UI and highlight correct/wrong answers
  quizData.forEach((q, qIdx) => {
    const parent = document.getElementById(`opts-${qIdx}`);
    const btns = parent.querySelectorAll('.quiz-btn');
    btns.forEach(b => { b.disabled = true; b.style.background = ''; });
    if (userAnswers[qIdx] === q.ans) {
      btns[userAnswers[qIdx]].classList.add('selected-correct');
    } else {
      btns[userAnswers[qIdx]].classList.add('selected-wrong');
      btns[q.ans].classList.add('selected-correct');
    }
  });

  document.getElementById("quiz-submit-section").style.display = 'none';
  showQuizResult();
}

function showQuizResult() {
  document.getElementById("quiz-result").classList.remove("hidden");

  let visualScore = 0;
  const scoreInt = setInterval(() => {
    document.getElementById("quiz-score").innerText = visualScore;
    if (visualScore === quizScore) clearInterval(scoreInt);
    visualScore++;
  }, 100);

  const reward = document.getElementById("quiz-reward");
  setTimeout(() => {
    if (quizScore === quizData.length) {
      reward.innerHTML = `Complimenti maestro <strong>${quizUser}</strong>!<br>Hai indovinato tutto! Reclama il tuo premio al ricevimento! 🥃`;
    } else if (quizScore >= 2) {
      reward.innerHTML = `Bravo <strong>${quizUser}</strong>, ci conosci abbastanza bene! Ma potevi fare di meglio... 😉`;
    } else {
      reward.innerHTML = `Ahi ahi <strong>${quizUser}</strong>... ci conosci per niente. Ti perdoniamo solo se ti scateni in pista! 🕺`;
    }

    if (!quizScoreboard.some(e => e.name === quizUser)) {
      quizScoreboard.push({ name: quizUser, score: quizScore });
      quizScoreboard.sort((a, b) => b.score - a.score);
      populateScoreboard();
    }
  }, 500);
}

function populateScoreboard() {
  const list = document.getElementById("scoreboard-list");
  if (!list) return;
  list.innerHTML = "";
  quizScoreboard.forEach((entry, idx) => {
    list.innerHTML += `<li style="padding: 10px 15px; border-bottom: 1px solid #ebebeb; display: flex; justify-content: space-between; align-items: center; background: ${idx % 2 === 0 ? '#fff' : '#fcfcfc'};">
       <span style="font-family:var(--font-sans); color:var(--text-color);"><strong>${idx + 1}.</strong> ${entry.name}</span>
       <span style="color:var(--primary-color); font-weight:800; font-size:1.1rem;">${entry.score} pt</span>
     </li>`;
  });
}

// --- RSVP LOGIC ---
function sendWhatsApp(isComing) {
  // Using a fallback number if none provided by the user. 
  // It is recommended the user changes this to their actual number.
  const number = "393394001216";

  let text = isComing
    ? "Ciao, confermo la mia presenza al vostro matrimonio! \u{1F60D}"
    : "Ciao, purtroppo non posso partecipare al matrimonio. \u{1F614}";

  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${number}?text=${encodedText}`;
  window.open(url, '_blank');
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4500);
}

// --- PETALS ---
function startPetals() {
  setInterval(() => {
    const main = document.getElementById("main");
    if (main.classList.contains("hidden")) return;

    const petal = document.createElement("div");
    petal.className = "petal";
    petal.style.left = Math.random() * 100 + "vw";

    const size = 6 + Math.random() * 8;
    petal.style.width = size + "px";
    petal.style.height = size + "px";

    const duration = 12 + Math.random() * 15;
    petal.style.animationDuration = duration + "s";

    document.body.appendChild(petal);

    setTimeout(() => { if (petal.parentNode) petal.remove(); }, duration * 1000);
  }, 1200);
}