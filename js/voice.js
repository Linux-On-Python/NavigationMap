/*
  voice.js
  --------
  Wraps the browser's built-in Web Speech API (free, no key, no cost) to
  speak Tails-style turn-by-turn lines. The actual wording lives in
  data/tails-phrases.json, not here. Also owns the mute button in the
  nav banner.
*/

const muteBtn = document.getElementById('nav-mute');

let muted = false;
let phrasesCache = null;

async function loadPhrases() {
  if (phrasesCache) return phrasesCache;
  try {
    const response = await fetch('data/tails-phrases.json');
    phrasesCache = await response.json();
  } catch (err) {
    console.error('Could not load Tails phrases — falling back to plain text.', err);
    phrasesCache = {};
  }
  return phrasesCache;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export async function announce(eventKey, extraText = '') {
  if (muted) return;

  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this browser.');
    return;
  }

  const phrases = await loadPhrases();
  const variants = phrases[eventKey];
  if (!variants || variants.length === 0) return;

  const line = pickRandom(variants);
  const text = extraText ? `${line} ${extraText}` : line;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = 1.4;
  utterance.rate = 1.05;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function isMuted() {
  return muted;
}

muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteBtn.setAttribute('aria-pressed', String(muted));
  muteBtn.style.opacity = muted ? '0.4' : '1';
  if (muted) window.speechSynthesis.cancel();
});