const COOKIE_STORAGE_KEY = 'seenFortunes';
const AUTO_OPEN_DELAY = 1200;

const cookieButton = document.getElementById('cookieButton');
const fortunePanel = document.getElementById('fortune-panel');
const fortuneMessage = document.getElementById('fortuneMessage');
const fortuneAuthor = document.getElementById('fortuneAuthor');
const fortuneAvatar = document.getElementById('fortuneAvatar');
const fortuneImage = document.getElementById('fortuneImage');
const fortuneImageWrapper = document.getElementById('fortuneImageWrapper');
const fortuneTags = document.getElementById('fortuneTags');
const fortuneDate = document.getElementById('fortuneDate');
const anotherFortuneButton = document.getElementById('anotherFortune');
const shareFortuneButton = document.getElementById('shareFortune');
const fortuneError = document.getElementById('fortuneError');
const retryButton = document.getElementById('retryLoad');

let fortunesCache = [];
let currentFortune = null;
let reducedMotion = false;
let openTimeout = null;
let playCrackSound = null;
let audioNeedsInteraction = false;
let isCookieOpen = false;
let awaitingAudioResume = false;

async function init() {
  reducedMotion = applyReducedMotion();
  setupAudio();
  attachEvents();
  await loadAndRender();
}

function attachEvents() {
  cookieButton.addEventListener('click', () => {
    if (!isCookieOpen) {
      openCookie();
    }
  });

  anotherFortuneButton.addEventListener('click', async () => {
    if (!fortunesCache.length) return;
    const fortune = getRandomFortune(fortunesCache);
    updateURLWithSlug(fortune.slug);
    await renderFortune(fortune, { reset: true });
  });

  shareFortuneButton.addEventListener('click', copyShare);
  retryButton.addEventListener('click', loadAndRender);
}

function setupAudio() {
  try {
    const audioElement = new Audio('assets/crack.mp3');
    audioElement.preload = 'auto';
    audioElement.volume = 0.85;
    audioElement.addEventListener(
      'error',
      () => {
        console.warn('Falling back to synthetic crack sound');
        configureProceduralAudio();
      },
      { once: true }
    );

    playCrackSound = () => {
      audioElement.currentTime = 0;
      return audioElement.play();
    };
  } catch (error) {
    configureProceduralAudio();
  }

  if (typeof playCrackSound !== 'function') {
    configureProceduralAudio();
  }
}

async function loadAndRender() {
  toggleError(false);
  try {
    fortunesCache = await loadFortunes();
    if (!Array.isArray(fortunesCache) || fortunesCache.length === 0) {
      throw new Error('No fortunes available');
    }
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    let fortune = slug ? getFortuneBySlug(fortunesCache, slug) : null;
    if (!fortune) {
      fortune = getRandomFortune(fortunesCache);
      updateURLWithSlug(fortune.slug);
    } else {
      markFortuneAsSeen(fortune);
    }
    await renderFortune(fortune, { reset: true, immediate: !!slug });
  } catch (error) {
    console.error(error);
    toggleError(true);
  }
}

function toggleError(show) {
  fortuneError.hidden = !show;
  fortunePanel.classList.toggle('is-visible', !show && isCookieOpen);
  anotherFortuneButton.disabled = show;
  shareFortuneButton.disabled = show;
  cookieButton.disabled = show;
}

export async function loadFortunes() {
  const response = await fetch('/fortune_cookies.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch fortunes');
  }
  return response.json();
}

export function getFortuneBySlug(fortunes, slug) {
  return fortunes.find((fortune) => fortune.slug === slug);
}

export function getRandomFortune(fortunes) {
  let seenRaw = null;
  try {
    seenRaw = window.localStorage.getItem(COOKIE_STORAGE_KEY);
  } catch (error) {
    seenRaw = null;
  }
  let seen = [];
  try {
    seen = seenRaw ? JSON.parse(seenRaw) : [];
  } catch (error) {
    seen = [];
  }

  const unseen = fortunes.filter((fortune) => !seen.includes(fortune.id));
  const pool = unseen.length > 0 ? unseen : fortunes;

  if (unseen.length === 0) {
    try {
      window.localStorage.removeItem(COOKIE_STORAGE_KEY);
    } catch (error) {
      console.warn('Unable to reset seen fortunes', error);
    }
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const fortune = pool[randomIndex];
  markFortuneAsSeen(fortune, seen);
  return fortune;
}

function markFortuneAsSeen(fortune, seenList) {
  const seen = Array.isArray(seenList)
    ? [...seenList]
    : (() => {
        let stored = null;
        try {
          stored = window.localStorage.getItem(COOKIE_STORAGE_KEY);
        } catch (error) {
          stored = null;
        }
        try {
          return stored ? JSON.parse(stored) : [];
        } catch (error) {
          return [];
        }
      })();

  if (!seen.includes(fortune.id)) {
    seen.push(fortune.id);
    try {
      window.localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(seen));
    } catch (error) {
      console.warn('Unable to persist seen fortunes', error);
    }
  }
}

export function applyReducedMotion() {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches) {
    document.documentElement.classList.add('reduced-motion');
  }
  media.addEventListener('change', (event) => {
    document.documentElement.classList.toggle('reduced-motion', event.matches);
    reducedMotion = event.matches;
  });
  return media.matches;
}

export function updateURLWithSlug(slug) {
  const url = new URL(window.location.href);
  url.searchParams.set('slug', slug);
  history.replaceState({}, '', url);
}

export async function renderFortune(fortune, options = {}) {
  const { reset = false, immediate = false } = options;
  currentFortune = fortune;

  const messageParagraph = fortuneMessage.querySelector('p');
  messageParagraph.textContent = fortune.mensaje;
  fortuneAuthor.textContent = fortune.personaje;

  renderAvatar(fortune.personaje);
  renderTags(fortune.tags);
  renderDate(fortune.fecha);
  await renderImage(fortune);

  fortunePanel.setAttribute('aria-hidden', 'true');
  cookieButton.setAttribute('aria-expanded', 'false');

  if (reset) {
    resetCookieState();
    scheduleOpen(immediate);
  }
}

function renderAvatar(name) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  fortuneAvatar.textContent = initials || '✨';
  fortuneAvatar.setAttribute('aria-label', name);
}

function renderTags(tags = []) {
  fortuneTags.innerHTML = '';
  if (!tags || tags.length === 0) {
    fortuneTags.setAttribute('aria-hidden', 'true');
    return;
  }
  fortuneTags.removeAttribute('aria-hidden');
  const template = document.getElementById('tagTemplate');
  tags.forEach((tag) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.textContent = tag;
    fortuneTags.appendChild(node);
  });
}

function renderDate(dateString) {
  if (!dateString) {
    fortuneDate.textContent = '';
    fortuneDate.removeAttribute('datetime');
    return;
  }
  fortuneDate.dateTime = dateString;
  try {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const date = new Date(dateString + 'T00:00:00');
    fortuneDate.textContent = formatter.format(date);
  } catch (error) {
    fortuneDate.textContent = dateString;
  }
}

async function renderImage(fortune) {
  fortuneImageWrapper.classList.remove('is-fallback');
  fortuneImage.hidden = true;
  fortuneImage.removeAttribute('src');
  removeFallbackText();

  const src = `/assets/fortune/${encodeURI(fortune.imagen)}`;

  try {
    await preloadImage(src);
    fortuneImage.onerror = () => {
      showImageFallback(fortune);
    };
    fortuneImage.src = src;
    fortuneImage.alt = `Ilustración de ${fortune.personaje}`;
    fortuneImage.hidden = false;
  } catch (error) {
    showImageFallback(fortune);
  }
}

function showImageFallback(fortune) {
  fortuneImageWrapper.classList.add('is-fallback');
  fortuneImage.hidden = true;
  removeFallbackText();
  const fallback = document.createElement('p');
  fallback.className = 'fallback-text';
  fallback.textContent = `“${fortune.mensaje}” — ${fortune.personaje}`;
  fortuneImageWrapper.appendChild(fallback);
}

function removeFallbackText() {
  const existing = fortuneImageWrapper.querySelector('.fallback-text');
  if (existing) {
    existing.remove();
  }
}

export async function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = url;
  });
}

function resetCookieState() {
  if (openTimeout) {
    clearTimeout(openTimeout);
    openTimeout = null;
  }
  isCookieOpen = false;
  cookieButton.classList.remove('is-open');
  cookieButton.setAttribute('aria-expanded', 'false');
  fortunePanel.classList.remove('is-visible');
  fortunePanel.setAttribute('aria-hidden', 'true');
}

function scheduleOpen(immediate) {
  if (reducedMotion) {
    openCookie();
    return;
  }
  if (immediate) {
    openCookie();
    return;
  }
  openTimeout = window.setTimeout(() => {
    openCookie();
  }, AUTO_OPEN_DELAY);
}

export function openCookie() {
  if (isCookieOpen || !currentFortune) {
    return;
  }
  isCookieOpen = true;
  cookieButton.classList.add('is-open');
  cookieButton.setAttribute('aria-expanded', 'true');
  fortunePanel.classList.add('is-visible');
  fortunePanel.setAttribute('aria-hidden', 'false');

  triggerCrackSound()
    .then(() => {
      audioNeedsInteraction = false;
    })
    .catch(() => {
      audioNeedsInteraction = true;
      scheduleAudioResume();
    });
}

function triggerCrackSound() {
  if (typeof playCrackSound !== 'function') {
    return Promise.resolve();
  }

  try {
    const result = playCrackSound();
    const promise = result instanceof Promise ? result : Promise.resolve(result);
    return promise.catch((error) => {
      if (shouldFallbackToProceduralAudio(error)) {
        configureProceduralAudio();
        if (typeof playCrackSound === 'function') {
          return playCrackSound();
        }
      }
      return Promise.reject(error);
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

function scheduleAudioResume() {
  if (awaitingAudioResume) {
    return;
  }

  awaitingAudioResume = true;

  const resumeAudio = () => {
    triggerCrackSound()
      .then(() => {
        audioNeedsInteraction = false;
        awaitingAudioResume = false;
      })
      .catch(() => {
        audioNeedsInteraction = true;
        awaitingAudioResume = false;
        scheduleAudioResume();
      });
  };

  document.addEventListener('click', resumeAudio, { once: true });
}

function shouldFallbackToProceduralAudio(error) {
  if (!error) {
    return false;
  }

  const unsupportedNames = ['NotSupportedError', 'AbortError'];
  if (unsupportedNames.includes(error.name)) {
    return true;
  }

  if (typeof error.message === 'string') {
    return /unsupported|decode|binary files/i.test(error.message);
  }

  return false;
}

function configureProceduralAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    playCrackSound = null;
    return;
  }

  const context = new AudioContextClass();

  const playBurst = () => {
    const duration = 0.28;
    const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i++) {
      const progress = i / channelData.length;
      const envelope = Math.pow(1 - progress, 3.5);
      channelData[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.85, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  };

  playCrackSound = () => {
    if (context.state === 'suspended') {
      return context.resume().then(() => {
        playBurst();
      });
    }

    playBurst();
    return Promise.resolve();
  };
}

export async function copyShare() {
  if (!currentFortune) return;
  const url = new URL(window.location.href).toString();
  const text = `“${currentFortune.mensaje}” — ${currentFortune.personaje}\n${url}\n#fortune #mensajes #ternura`;

  try {
    await navigator.clipboard.writeText(text);
    shareFortuneButton.textContent = '✅ Copiado';
  } catch (error) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      shareFortuneButton.textContent = '✅ Copiado';
    } catch (err) {
      shareFortuneButton.textContent = 'Copia manual 🙏';
    }
  }

  setTimeout(() => {
    shareFortuneButton.textContent = '🔗 Compartir';
  }, 2000);
}

document.addEventListener('DOMContentLoaded', init);
