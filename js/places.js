/*
  places.js
  ---------
  Saved places: favorites, "want to visit" spots, and custom categories
  (College, Supermarket, Pharmacy, etc.), each with a Sonic-ring-style
  icon badge. Reads/writes real data via storage.js.

  Each saved place can now carry real coordinates (captured automatically
  when saved from the map or a search result). Tapping a saved place
  fires a "routesync:go-to-place" custom event rather than importing
  routing.js directly — routing.js already imports savePlace() from this
  file, so a direct import back here would create a circular dependency.
  routing.js listens for that event and handles the actual routing.

  NOTE: "Add place" still uses simple prompt() dialogs as a placeholder
  input method for the type/category. A proper modal (category picker,
  icon choices) is a good next UI module to build.
*/

import { getItem, setItem } from './storage.js';

const listEl = document.getElementById('saved-places-list');
const addBtn = document.getElementById('add-place-btn');

const BADGE_ICONS = {
  favorite:
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>',
  'want-to-visit':
    '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M4 2v20M4 4h14l-3 4 3 4H4" /></svg>',
  category:
    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" /></svg>',
};

const BADGE_CLASS = {
  favorite: 'place-badge--favorite',
  'want-to-visit': 'place-badge--want-to-visit',
  category: 'place-badge--category',
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadPlaces() {
  return getItem('places', []);
}

function savePlaces(places) {
  setItem('places', places);
}

function metaLabel(place) {
  if (place.type === 'favorite') {
    return place.category ? `Favorite &middot; ${place.category}` : 'Favorite';
  }
  if (place.type === 'want-to-visit') {
    return 'Want to visit';
  }
  return place.category || 'Saved place';
}

export function renderPlaces() {
  const places = loadPlaces();
  listEl.innerHTML = '';

  if (places.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No saved places yet — tap "Add place" to save your first one.</li>';
    return;
  }

  for (const place of places) {
    const li = document.createElement('li');
    li.className = 'place-item';
    li.innerHTML = `
      <span class="place-badge ${BADGE_CLASS[place.type] || 'place-badge--category'}" aria-hidden="true">
        ${BADGE_ICONS[place.type] || BADGE_ICONS.category}
      </span>
      <span class="place-item__text">
        <span class="place-item__name"></span>
        <span class="place-item__meta"></span>
      </span>
      <button type="button" class="place-item__delete" aria-label="Delete this place">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    `;
    li.querySelector('.place-item__name').textContent = place.name;
    li.querySelector('.place-item__meta').innerHTML = metaLabel(place);

    li.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('routesync:go-to-place', { detail: place }));
    });

    li.querySelector('.place-item__delete').addEventListener('click', (event) => {
      event.stopPropagation();
      const remaining = loadPlaces().filter((p) => p.id !== place.id);
      savePlaces(remaining);
      renderPlaces();
    });

    listEl.appendChild(li);
  }
}

export function savePlace(name, coords = null) {
  const type = window.prompt(
    'Type: enter "favorite", "want" (want to visit), or a category label like "College" / "Supermarket"'
  );
  if (!type) return;

  const normalized = type.trim().toLowerCase();
  let place;
  if (normalized === 'favorite') {
    place = { id: generateId(), name, type: 'favorite', coords };
  } else if (normalized === 'want') {
    place = { id: generateId(), name, type: 'want-to-visit', coords };
  } else {
    place = { id: generateId(), name, type: 'category', category: type.trim(), coords };
  }

  const places = loadPlaces();
  places.push(place);
  savePlaces(places);
  renderPlaces();
}

function addPlace() {
  const name = window.prompt('Place name (e.g. "Grocery run"):');
  if (!name) return;
  savePlace(name, null);
}

addBtn.addEventListener('click', addPlace);
renderPlaces();