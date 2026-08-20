/*
  journeys.js
  -----------
  Recent journeys: the last 3 places the person actually navigated to,
  most recent first. Starts empty for a new user — entries only appear
  once navigation.js (a later module) calls addJourney() when a real
  trip is taken. This file only owns storage + rendering; nothing here
  is hardcoded demo data.
*/

import { getItem, setItem } from './storage.js';

const listEl = document.getElementById('recent-journeys-list');
const searchInput = document.getElementById('destination-search');

const MAX_RECENT = 3;

function loadJourneys() {
  return getItem('journeys', []);
}

function saveJourneys(journeys) {
  setItem('journeys', journeys);
}

export function renderJourneys() {
  const journeys = loadJourneys();
  listEl.innerHTML = '';

  if (journeys.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No trips yet — places you navigate to will show up here.</li>';
    return;
  }

  for (const journey of journeys) {
    const li = document.createElement('li');
    li.className = 'journey-item';
    li.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
      </svg>
      <span></span>
    `;
    li.querySelector('span').textContent = journey.name;
    li.addEventListener('click', () => {
      // Until routing.js exists, clicking a recent journey just fills
      // the search box — real re-routing hooks in here later.
      searchInput.value = journey.name;
      searchInput.focus();
    });
    listEl.appendChild(li);
  }
}

// Called by navigation.js (next step) whenever a real trip starts.
export function addJourney(name) {
  const journeys = loadJourneys();
  const deduped = journeys.filter((j) => j.name !== name);
  deduped.unshift({ name, at: Date.now() });
  saveJourneys(deduped.slice(0, MAX_RECENT));
  renderJourneys();
}

renderJourneys();