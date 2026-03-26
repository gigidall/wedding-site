// --- STATE ---
let musicPlaying = false;
let wavesurfer = null;

// Globals
let guestsArray = [];
let quizScoreboard = [];

async function loadGuestsData() {
  try {
    const res = await fetch('api.php?action=search&q=');
    if (!res.ok) throw new Error("No API");
    const json = await res.json();
    guestsArray = json.map(g => ({ id: g.id, name: g.nome + ' ' + g.cognome }));
  } catch (err) {
    guestsArray = [
      { id: "1", name: "Mario Rossi" },
      { id: "2", name: "Luigi Verdi" }
    ];
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
        setTimeout(drawOrganicTimeline, 50);

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

  let currentTrackIndex = 0;
  const playlist = [
    'assets/Thinking Out Loud - Ed Sheeran.mp3',
    'assets/Everything I Do - Bryan Adams.mp3'
  ];

  wavesurfer.load(playlist[currentTrackIndex]);

  // Native UI sync per evitare lag durante il caricamento della seconda traccia
  wavesurfer.on('play', () => {
    musicPlaying = true;
    updateAudioUI();
  });
  wavesurfer.on('pause', () => {
    musicPlaying = false;
    updateAudioUI();
  });

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
    currentTrackIndex++;
    if (currentTrackIndex < playlist.length) {
      wavesurfer.load(playlist[currentTrackIndex]);
      wavesurfer.once('ready', () => {
        wavesurfer.play();
      });
    } else {
      musicPlaying = false;
      updateAudioUI();
    }
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
  } else {
    wavesurfer.play();
  }
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
const globalImages = ["assets/images/09caf564-f9a8-4923-b17f-b6b7ca4daca5.jpg", "assets/images/1.jpg", "assets/images/20171209_172955.jpg", "assets/images/3.jpg", "assets/images/3fe22d62-5dba-4d47-a47e-bd315beacede.jpg", "assets/images/4.jpg", "assets/images/7202c811-e88e-4341-accd-fba18ddee299.jpg", "assets/images/75aea258-9415-407d-8a76-b9383efc61f4.jpg", "assets/images/7cdc9428-3a47-4212-be3c-bbd406005cac.jpg", "assets/images/IMG-20191101-WA0011.jpg", "assets/images/IMG-20221009-WA0184.jpg", "assets/images/IMG-20230101-WA0035.jpg", "assets/images/IMG-20230226-WA0000.jpg", "assets/images/IMG-20230226-WA0001.jpg", "assets/images/IMG_0282.HEIC", "assets/images/IMG_0352.HEIC", "assets/images/IMG_0474.HEIC", "assets/images/IMG_0479.HEIC", "assets/images/IMG_0486.HEIC", "assets/images/IMG_0488.HEIC", "assets/images/IMG_0496.HEIC", "assets/images/IMG_0508.HEIC", "assets/images/IMG_0528.HEIC", "assets/images/IMG_0542.HEIC", "assets/images/IMG_0630.HEIC", "assets/images/IMG_0692.HEIC", "assets/images/IMG_0693.HEIC", "assets/images/IMG_0694.HEIC", "assets/images/IMG_0756.HEIC", "assets/images/IMG_1075.HEIC", "assets/images/IMG_1094.HEIC", "assets/images/IMG_1622.HEIC", "assets/images/IMG_1654.HEIC", "assets/images/IMG_20190223_155855.jpg", "assets/images/IMG_20190223_161153.jpg", "assets/images/IMG_20190223_175007.jpg", "assets/images/IMG_20190224_153317.jpg", "assets/images/IMG_20190224_162820.jpg", "assets/images/IMG_20190303_163420.jpg", "assets/images/IMG_20191103_121436.jpg", "assets/images/IMG_20200809_192419.jpg", "assets/images/IMG_20210313_150259.jpg", "assets/images/IMG_20210313_150316.jpg", "assets/images/IMG_20210729_195638.jpg", "assets/images/IMG_20210729_200115.jpg", "assets/images/IMG_20210729_200159.jpg", "assets/images/IMG_20211031_130857.jpg", "assets/images/IMG_20211208_124056.jpg", "assets/images/IMG_20220106_161934.jpg", "assets/images/IMG_20220603_094950.jpg", "assets/images/IMG_20220603_104852.jpg", "assets/images/IMG_20220709_230224.jpg", "assets/images/IMG_20220731_170018.jpg", "assets/images/IMG_20220809_153902.jpg", "assets/images/IMG_20220809_202319.jpg", "assets/images/IMG_20220809_202329.jpg", "assets/images/IMG_20220809_202340.jpg", "assets/images/IMG_20220809_202433.jpg", "assets/images/IMG_20220809_202527.jpg", "assets/images/IMG_20220809_202544.jpg", "assets/images/IMG_20220812_135624.jpg", "assets/images/IMG_20220812_230221.jpg", "assets/images/IMG_20220812_235700.jpg", "assets/images/IMG_20220813_123552.jpg", "assets/images/IMG_20220813_125225.jpg", "assets/images/IMG_20220813_125927.jpg", "assets/images/IMG_20220813_165437.jpg", "assets/images/IMG_20220813_171708.jpg", "assets/images/IMG_20220813_173857.jpg", "assets/images/IMG_20220814_154154.jpg", "assets/images/IMG_20220815_164121.jpg", "assets/images/IMG_20220816_064357.jpg", "assets/images/IMG_20220816_121324.jpg", "assets/images/IMG_20220816_142406.jpg", "assets/images/IMG_20220817_191727.jpg", "assets/images/IMG_20220817_191755.jpg", "assets/images/IMG_20221008_222458.jpg", "assets/images/IMG_20221016_152235.jpg", "assets/images/IMG_20221029_182820.jpg", "assets/images/IMG_20221203_210504.jpg", "assets/images/IMG_20221211_125153.jpg", "assets/images/IMG_20221231_212322.jpg", "assets/images/IMG_20230218_182054.jpg", "assets/images/IMG_20230218_192246.jpg", "assets/images/IMG_2179.HEIC", "assets/images/IMG_2381.HEIC", "assets/images/IMG_2405.HEIC", "assets/images/IMG_2406.HEIC", "assets/images/IMG_2469.HEIC", "assets/images/IMG_2476.HEIC", "assets/images/IMG_2483.HEIC", "assets/images/IMG_2507.HEIC", "assets/images/IMG_2515.HEIC", "assets/images/IMG_2530.HEIC", "assets/images/IMG_2548.HEIC", "assets/images/IMG_2622.HEIC", "assets/images/IMG_2648.HEIC", "assets/images/IMG_2762.HEIC", "assets/images/IMG_3062.HEIC", "assets/images/IMG_3242.HEIC", "assets/images/IMG_3404.HEIC", "assets/images/IMG_3416.HEIC", "assets/images/IMG_3454.HEIC", "assets/images/IMG_3467.HEIC", "assets/images/IMG_3487.HEIC", "assets/images/IMG_3505.HEIC", "assets/images/IMG_3555.HEIC", "assets/images/IMG_3576.HEIC", "assets/images/IMG_4116.HEIC", "assets/images/IMG_4130.HEIC", "assets/images/IMG_4135.HEIC", "assets/images/IMG_4143.HEIC", "assets/images/IMG_4152.HEIC", "assets/images/IMG_4166.HEIC", "assets/images/IMG_4170.HEIC", "assets/images/IMG_4201.HEIC", "assets/images/IMG_4235.HEIC", "assets/images/IMG_4264.HEIC", "assets/images/IMG_4518.HEIC", "assets/images/IMG_4667.HEIC", "assets/images/IMG_4764.HEIC", "assets/images/IMG_4949.HEIC", "assets/images/IMG_4964.HEIC", "assets/images/IMG_4965.HEIC", "assets/images/IMG_5005.HEIC", "assets/images/IMG_5027.HEIC", "assets/images/IMG_5029.HEIC", "assets/images/IMG_5040.HEIC", "assets/images/IMG_5066.HEIC", "assets/images/IMG_5105.HEIC", "assets/images/IMG_5139.HEIC", "assets/images/IMG_5141.HEIC", "assets/images/IMG_5535.HEIC", "assets/images/IMG_5537.HEIC", "assets/images/IMG_5550.HEIC", "assets/images/IMG_5555.HEIC", "assets/images/IMG_5571.HEIC", "assets/images/IMG_5579.HEIC", "assets/images/IMG_5591.HEIC", "assets/images/IMG_5593.HEIC", "assets/images/IMG_5594.HEIC", "assets/images/IMG_5610.HEIC", "assets/images/IMG_5616.HEIC", "assets/images/IMG_5756.HEIC", "assets/images/IMG_5767.HEIC", "assets/images/IMG_5770.HEIC", "assets/images/IMG_5784.HEIC", "assets/images/IMG_5796.HEIC", "assets/images/IMG_5848.HEIC", "assets/images/IMG_5865.HEIC", "assets/images/IMG_5905.HEIC", "assets/images/IMG_5965.HEIC", "assets/images/IMG_5969.HEIC", "assets/images/IMG_5977.HEIC", "assets/images/IMG_6039.HEIC", "assets/images/IMG_6090.HEIC", "assets/images/IMG_6095.HEIC", "assets/images/IMG_6102.HEIC", "assets/images/IMG_6105.HEIC", "assets/images/IMG_6109.HEIC", "assets/images/IMG_6114.HEIC", "assets/images/ca8282d6-277a-4add-9046-c344fc0a0736.jpg"];

function initExplicitGallery() {
  const container = document.getElementById('galleryContainer');
  const counter = document.getElementById('gallery-counter');
  if (!container) return;

  if (counter) counter.innerText = `1 / ${globalImages.length}`;

  let index = 0;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active-snap');
        if (counter) {
          const children = Array.from(container.children);
          const idx = children.indexOf(entry.target);
          counter.innerText = `${idx + 1} / ${globalImages.length}`;
        }
      } else {
        entry.target.classList.remove('active-snap');
      }
    });
  }, { root: container, threshold: 0.6 });

  globalImages.forEach((src, idx) => {
    const img = new Image();
    img.src = src;
    img.loading = "lazy";

    img.onerror = function () {
      this.parentElement.style.display = 'none';
      observer.unobserve(this.parentElement);
    };

    const item = document.createElement("div");
    item.className = "gallery-item";

    img.onclick = () => openLightbox(img.src, idx);
    item.appendChild(img);

    container.appendChild(item);
    observer.observe(item);
  });
}

let currentLightboxIndex = 0;

function updateLightboxCounter() {
  const lbcounter = document.getElementById("lightbox-counter");
  if (lbcounter) lbcounter.innerText = `${currentLightboxIndex + 1} / ${globalImages.length}`;
}

function openLightbox(src, index) {
  currentLightboxIndex = index;
  const lb = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = src;
  updateLightboxCounter();
  lb.classList.add("show");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("show");
}

function lightboxPrev(e) {
  if (e) e.stopPropagation();
  if (currentLightboxIndex > 0) {
    currentLightboxIndex--;
    document.getElementById("lightbox-img").src = globalImages[currentLightboxIndex];
    updateLightboxCounter();
  }
}

function lightboxNext(e) {
  if (e) e.stopPropagation();
  if (currentLightboxIndex < globalImages.length - 1) {
    currentLightboxIndex++;
    document.getElementById("lightbox-img").src = globalImages[currentLightboxIndex];
    updateLightboxCounter();
  }
}

// Initialize swipe support for lightbox
document.addEventListener("DOMContentLoaded", () => {
  const lb = document.getElementById("lightbox");
  let touchstartX = 0;

  lb.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lb.addEventListener('touchend', e => {
    const touchendX = e.changedTouches[0].screenX;
    if (touchstartX - touchendX > 50) lightboxNext(); // swipe left -> next
    if (touchendX - touchstartX > 50) lightboxPrev(); // swipe right -> prev
  }, { passive: true });
});

let galleryAutoScrollInt;

function startGalleryAutoScroll() {
  if (galleryAutoScrollInt) clearInterval(galleryAutoScrollInt);
  galleryAutoScrollInt = setInterval(() => {
    const container = document.getElementById("galleryContainer");
    if (!container) return;

    // Reset se siamo arrivati alla fine
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      const itemWidth = container.querySelector('.gallery-item') ? container.querySelector('.gallery-item').offsetWidth : 300;
      container.scrollBy({ left: itemWidth + 15, behavior: 'smooth' });
    }
  }, 3000);
}

function resetGalleryAutoScroll() {
  if (galleryAutoScrollInt) clearInterval(galleryAutoScrollInt);
  startGalleryAutoScroll();
}

function scrollGallery(dir) {
  const container = document.getElementById("galleryContainer");
  if (container) {
    const itemWidth = container.querySelector('.gallery-item') ? container.querySelector('.gallery-item').offsetWidth : 300;
    container.scrollBy({ left: dir * (itemWidth + 15), behavior: 'smooth' });
    resetGalleryAutoScroll();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  startGalleryAutoScroll();
  const container = document.getElementById("galleryContainer");
  if (container) {
    container.addEventListener('touchstart', () => clearInterval(galleryAutoScrollInt), { passive: true });
    container.addEventListener('touchend', () => startGalleryAutoScroll(), { passive: true });
    container.addEventListener('wheel', resetGalleryAutoScroll, { passive: true });
  }
});


// --- ADVANCED QUIZ UX ---
const quizData = [
  { q: "Qual è stata la nostra prima vacanza insieme?", opts: ["Barcellona", "Sicilia", "Puglia", "Roma"], ans: 3 },
  { q: "Chi ha detto 'Ti amo' per primo?", opts: ["Antonella", "Mauro", "Insieme nello stesso momento", "Nessuno se lo ricorda"], ans: 4 },
  { q: "Qual è il piatto forte di Mauro?", opts: ["Carbonara", "Lasagne", "Risotto ai funghi", "Nessuno, sa solo ordinare su Glovo"], ans: 4 },
  { q: "Dove è avvenuta la proposta di matrimonio?", opts: ["Al ristorante", "Ad un concerto", "A casa nostra", "In montagna durante un'escursione"], ans: 2 },
  { q: "Chi dei due è il più ritardatario cronico?", opts: ["Mauro", "Antonella", "Sono svizzeri entrambi", "Dipende dalla stagione"], ans: 2 },
  { q: "Qual è la serie TV che hanno divorato insieme?", opts: ["Stranger Things", "La Casa di Carta", "Game of Thrones", "Breaking Bad"], ans: 4 },
  { q: "Chi ha più pazienza quando si tratta di fare shopping?", opts: ["Mauro resiste per ore", "Antonella senza dubbio", "Entrambi odiano lo shopping", "Solo se ci sono sconti"], ans: 4 },
  { q: "Qual è il loro vizio condiviso la sera?", opts: ["Bere una tisana", "Film su Netflix e divano", "Leggere un libro", "Addormentarsi alle 21:00"], ans: 2 }
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
    const displayStyle = qIdx === 0 ? "block" : "none";
    html += `<div class="quiz-q-block" id="qblock-${qIdx}" style="display: ${displayStyle}; margin-bottom:30px; background: rgba(212,163,115,0.05); border-radius: 12px; padding: 20px; transition: opacity 0.4s; opacity: 1;">
        <h3 class="quiz-question" style="margin-bottom: 20px; font-size: 1rem; color: var(--primary-dark);">Domanda ${qIdx + 1} di ${quizData.length}<br><br><span style="color:var(--text-color);">${qObj.q}</span></h3>
        <div class="quiz-options-grid" id="opts-${qIdx}" style="display: grid; grid-template-columns: 1fr; gap: 10px;">`;
    qObj.opts.forEach((opt, idx) => {
      html += `<button class="quiz-btn" style="min-height: 60px; word-break: break-word; white-space: normal;" onclick="selectQuizAnswer(${qIdx}, ${idx}, this)">${labels[idx]}${opt}</button>`;
    });
    html += `</div></div>`;
  });
  container.innerHTML = html;

  const submitSec = document.getElementById("quiz-submit-section");
  if (submitSec) submitSec.style.display = "none";
}

function selectQuizAnswer(qIdx, optIdx, btn) {
  if (btn.parentElement.dataset.answered === "true") return;
  btn.parentElement.dataset.answered = "true";

  userAnswers[qIdx] = optIdx;
  const allBtns = btn.parentElement.querySelectorAll('.quiz-btn');
  allBtns.forEach(b => { b.style.background = ''; b.style.color = ''; b.style.borderColor = ''; });
  btn.style.background = 'var(--primary-color)';
  btn.style.color = '#fff';

  setTimeout(() => {
    const currentBlock = document.getElementById(`qblock-${qIdx}`);
    if (currentBlock) {
      currentBlock.style.opacity = '0';
      setTimeout(() => {
        currentBlock.style.display = 'none';

        if (qIdx + 1 < quizData.length) {
          const nextBlock = document.getElementById(`qblock-${qIdx + 1}`);
          if (nextBlock) {
            nextBlock.style.display = 'block';
            nextBlock.style.opacity = '0';
            void nextBlock.offsetWidth;
            nextBlock.style.opacity = '1';
            nextBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          const submitSec = document.getElementById("quiz-submit-section");
          if (submitSec) {
            submitSec.style.display = "block";
            submitSec.style.opacity = "0";
            void submitSec.offsetWidth;
            submitSec.style.opacity = "1";
            submitSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 400);
    }
  }, 500);
}

async function submitFullQuiz() {
  const inputEl = document.getElementById("quiz-username");
  const fullname = inputEl.value.trim();
  const guestId = inputEl.dataset.id;

  if (!fullname) { showToast("Inserisci il tuo nome dalla lista prima di inviare!"); return; }

  let match = guestsArray.find(g => g.name.toLowerCase() === fullname.toLowerCase());
  const finalId = guestId || (match ? match.id : null);

  if (!finalId) { showToast("Spiacenti, nome non in lista."); return; }

  if (Object.keys(userAnswers).length < quizData.length) { showToast("Rispondi a tutte le domande per continuare!"); return; }

  let score = 0;
  quizData.forEach((q, idx) => { if (userAnswers[idx] === q.ans) score++; });
  quizScore = score;
  quizUser = fullname;

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'quiz');
    formData.append('id', finalId);
    formData.append('score', score);

    const response = await fetch('api.php', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (result && result.rank) {
      window.quizRank = result.rank;
      window.quizLeaderboard = result.leaderboard;
    }
  } catch (e) { }

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

function createConfetti() {
  for (let i = 0; i < 30; i++) {
    const conf = document.createElement("div");
    conf.innerText = "🎉";
    conf.style.position = "fixed";
    conf.style.left = Math.random() * 100 + "vw";
    conf.style.top = Math.random() * -20 + "vh";
    conf.style.fontSize = (Math.random() * 20 + 20) + "px";
    conf.style.zIndex = "99999";
    conf.style.pointerEvents = "none";
    conf.style.transition = "transform 3s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 3s";
    document.body.appendChild(conf);

    setTimeout(() => {
      conf.style.transform = `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`;
      conf.style.opacity = "0";
    }, 50);
    setTimeout(() => conf.remove(), 3100);
  }
}

function showQuizResult() {
  document.getElementById("quiz-result").classList.remove("hidden");

  createConfetti();

  let targetPercentage = Math.round((quizScore / quizData.length) * 100);

  // Implement Progress Bar natively inside DOM structure mapping
  const circleContainer = document.querySelector(".score-circle");
  if (circleContainer) {
    circleContainer.outerHTML = `
      <div style="background: rgba(212,163,115,0.1); width: 100%; height: 40px; border-radius: 20px; overflow: hidden; margin: 30px 0; position: relative; box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);">
         <div id="quiz-progress-fill" style="width: 0%; height: 100%; background: var(--primary-color); border-radius: 20px; transition: width 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);"></div>
         <span id="quiz-score" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); color: var(--primary-dark); font-weight: 800; font-size: 1.1rem; font-family: var(--font-sans); letter-spacing: 1px;">Risultato: 0%</span>
      </div>
    `;
  }

  let visualScore = 0;
  const scoreInt = setInterval(() => {
    document.getElementById("quiz-score").innerHTML = `Risultato: ${visualScore}%`;
    if (visualScore >= targetPercentage) {
      document.getElementById("quiz-score").innerHTML = `Risultato: ${targetPercentage}%`;
      clearInterval(scoreInt);
    } else {
      visualScore += 2;
    }
  }, 20);

  setTimeout(() => {
    document.getElementById("quiz-progress-fill").style.width = targetPercentage + "%";
  }, 50);

  const reward = document.getElementById("quiz-reward");
  setTimeout(() => {
    if (window.quizRank) {
      reward.innerHTML = `<strong>${quizUser}</strong><br><br><span style="font-size:1.2rem; color: var(--primary-dark);">Sei <strong>${window.quizRank}°</strong> in classifica generale!</span>`;
    } else {
      reward.innerHTML = `Grazie <strong>${quizUser}</strong>! Risposte registrate.`;
    }

    const lbContainer = document.getElementById("scoreboard-list");
    if (lbContainer && window.quizLeaderboard) {
      lbContainer.innerHTML = '';
      window.quizLeaderboard.forEach((user, index) => {
        const pct = Math.round((user.score / quizData.length) * 100);
        let medal = '';
        if (index === 0) medal = '🥇 ';
        if (index === 1) medal = '🥈 ';
        if (index === 2) medal = '🥉 ';
        lbContainer.innerHTML += `<li style="padding: 12px 10px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; font-size:1.05rem;">
           <span style="font-family:var(--font-sans); color:var(--text-color);">${medal}<strong>${user.name}</strong></span>
           <span style="font-weight:800; color:var(--primary-dark); font-size:1.15rem;">${pct}%</span>
         </li>`;
      });
      lbContainer.parentElement.style.display = 'block';
    } else if (lbContainer) {
      lbContainer.parentElement.style.display = 'none';
    }
  }, 1000);
}

// --- RSVP LOGIC ---
function sendWhatsApp(isComing) {
  const number = "393394001216";
  let text = isComing
    ? "Ciao, confermo la mia presenza al vostro matrimonio! 😍"
    : "Ciao, purtroppo non posso partecipare al matrimonio. 😔";
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${number}?text=${encodedText}`;
  window.open(url, '_blank');
}

async function markPresence(input, hintBoxId, isComing) {
  const fullname = input.value.trim();
  const guestId = input.dataset.id;

  if (!fullname) {
    showToast("Per favore, inserisci il tuo nome dalla lista.");
    return;
  }

  let match = guestsArray.find(g => g.name.toLowerCase() === fullname.toLowerCase());
  const finalId = guestId || (match ? match.id : null);

  if (!finalId) {
    showToast("Spiacenti, nome non in lista.");
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('action', 'confirm');
    formData.append('id', finalId);
    formData.append('value', isComing ? 'true' : 'false');

    await fetch('api.php', { method: 'POST', body: formData });
  } catch (e) {
    console.error("API error", e);
  }

  showToast("Preferenza registrata nel backend!");
  setTimeout(() => sendWhatsApp(isComing), 2000);
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

// --- AUTO-PAUSE BACKGROUND/STANDBY ---
document.addEventListener("visibilitychange", () => {
  if (document.hidden && typeof wavesurfer !== 'undefined' && wavesurfer && wavesurfer.isPlaying()) {
    wavesurfer.pause();
    if (typeof musicPlaying !== 'undefined') musicPlaying = false;
    const playIcon = document.getElementById("icon-play");
    const pauseIcon = document.getElementById("icon-pause");
    if (playIcon) playIcon.style.display = "block";
    if (pauseIcon) pauseIcon.style.display = "none";
  }
});

function drawOrganicTimeline() {
  const container = document.querySelector('.timeline-container');
  const markers = document.querySelectorAll('.timeline-marker');
  const svg = document.getElementById('organic-timeline-svg');
  if (!container || markers.length === 0 || !svg) return;

  const rectContainer = container.getBoundingClientRect();
  svg.style.width = container.offsetWidth + 'px';
  svg.style.height = container.offsetHeight + 'px';

  let pathD = "";
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const rect = marker.getBoundingClientRect();
    const x = rect.left - rectContainer.left + (rect.width / 2);
    const y = rect.top - rectContainer.top + (rect.height / 2);

    if (i === 0) {
      pathD += `M ${x} ${y} `;
    } else {
      const prevMarker = markers[i - 1];
      const prevRect = prevMarker.getBoundingClientRect();
      const prevX = prevRect.left - rectContainer.left + (rect.width / 2);
      const prevY = prevRect.top - rectContainer.top + (rect.height / 2);

      const midY = (prevY + y) / 2;
      const wobble = ((i % 2 === 0) ? -35 : 35);
      pathD += `C ${prevX + wobble} ${midY}, ${x - wobble} ${midY}, ${x} ${y} `;
    }
  }
  const pathElement = svg.querySelector('path');
  if (pathElement) { pathElement.setAttribute('d', pathD); }
}
window.addEventListener('resize', () => { setTimeout(drawOrganicTimeline, 100) });
