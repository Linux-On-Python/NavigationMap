/*
  routing.js
  ----------
  Handles going from "where do I want to go" to an actual route, in a
  Google-Maps-like flow:

    1. Type a place and press Enter → shows up to 5 real matching results
       (via Nominatim geocoding), not just auto-picking the first one.
    2. Tap anywhere on the map → reverse-geocodes that point to find its
       nearest known address/place name.
    3. Either way, you get a small place card (name + "Go" / "Save"
       buttons) — tapping "Go" draws the real OSRM route as a PREVIEW
       only. "Start trip" / "Cancel" buttons then appear at the bottom
       of the map: Start trip actually begins turn-by-turn + voice
       guidance; Cancel dismisses the preview. "Save" adds the place to
       Saved Places (with coordinates, so tapping it later goes straight
       there).
    4. Tapping a Saved Place in the side panel fires a
       "routesync:go-to-place" event (see places.js) — handled here so
       places.js doesn't need to import routing.js directly (that would
       create a circular import, since routing.js already imports
       savePlace from places.js).

  HONEST LIMITATION ON "FASTEST ROUTE": OSRM's free public server
  calculates routes from road topology and speed limits only — it has
  no live traffic data. There's no free equivalent to Google's real-time
  traffic, so "fastest by road network" is the ceiling here.

  Free services used, no API key:
    - Nominatim (search + reverse): https://nominatim.openstreetmap.org
    - OSRM demo server: https://router.project-osrm.org
*/

import { getMap, getUserLocation } from './map.js';
import { savePlace } from './places.js';
import { startNavigation, stopNavigation } from './navigation.js';

const searchInput = document.getElementById('destination-search');
const resultsList = document.getElementById('search-results');
const cancelBtn = document.getElementById('nav-cancel');
const previewActions = document.getElementById('route-preview-actions');
const startTripBtn = document.getElementById('start-trip-btn');
const cancelPreviewBtn = document.getElementById('cancel-preview-btn');

let routeOutline = null;
let routeLine = null;
let destinationMarker = null;
let previewMarker = null;
let previewedRoute = null;

function createDestinationIcon() {
  return L.divIcon({
    className: 'destination-marker',
    html: `<svg width="28" height="28" viewBox="0 0 24 24" fill="#F4A036" stroke="#4A2A05" stroke-width="1">
             <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z" />
           </svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function clearRoute() {
  const map = getMap();
  if (routeOutline) { map.removeLayer(routeOutline); routeOutline = null; }
  if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
  if (destinationMarker) { map.removeLayer(destinationMarker); destinationMarker = null; }
  previewedRoute = null;
  previewActions.classList.remove('is-visible');
}

function clearResults() {
  resultsList.innerHTML = '';
}

async function searchPlaces(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Search request failed');
  return response.json();
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Reverse geocoding failed');
  const data = await response.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function fetchRoute(start, end) {
  const coords = `${start[1]},${start[0]};${end[1]},${end[0]}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Routing request failed');
  const data = await response.json();
  if (!data.routes || data.routes.length === 0) throw new Error('No route found');
  return data.routes[0];
}

export async function routeTo(destination) {
  const map = getMap();
  const start = getUserLocation();
  if (!map || !start) {
    console.warn('Map or user location not ready yet — try again in a moment.');
    return;
  }

  clearRoute();

  let route;
  try {
    route = await fetchRoute(start, destination);
  } catch (err) {
    console.error(err);
    window.alert("Couldn't find a route there. Please try again.");
    return;
  }

  const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

  routeOutline = L.polyline(latLngs, {
    color: '#2b2b2b',
    weight: 9,
    opacity: 0.55,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(map);

  routeLine = L.polyline(latLngs, {
    color: '#F4A036',
    weight: 5,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(map);

  destinationMarker = L.marker(destination, { icon: createDestinationIcon() }).addTo(map);
  map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

  return route;
}

cancelBtn.addEventListener('click', () => {
  clearRoute();
  stopNavigation();
});

cancelPreviewBtn.addEventListener('click', () => {
  clearRoute();
});

startTripBtn.addEventListener('click', () => {
  if (previewedRoute) {
    startNavigation(previewedRoute);
    previewActions.classList.remove('is-visible');
  }
});

function placeCardHtml(name) {
  return `
    <div class="place-card">
      <span class="place-card__name"></span>
      <div class="place-card__actions">
        <button type="button" class="place-card__go">Go</button>
        <button type="button" class="place-card__save">Save</button>
      </div>
    </div>
  `;
}

function showPlaceCard(coords, name) {
  const map = getMap();

  if (previewMarker) map.removeLayer(previewMarker);

  previewMarker = L.marker(coords, { icon: createDestinationIcon() }).addTo(map);
  previewMarker.bindPopup(placeCardHtml(name));

  previewMarker.on('popupopen', (event) => {
    const el = event.popup.getElement();
    el.querySelector('.place-card__name').textContent = name;

    el.querySelector('.place-card__go').addEventListener('click', async () => {
      const route = await routeTo(coords);
      if (route) {
        previewedRoute = route;
        previewActions.classList.add('is-visible');
      }
      map.closePopup();
    });

    el.querySelector('.place-card__save').addEventListener('click', () => {
      savePlace(name, coords);
      map.closePopup();
    });
  });

  previewMarker.openPopup();
}

function renderResults(results) {
  clearResults();

  if (results.length === 0) {
    resultsList.innerHTML = '<li class="empty-state">No places found. Try a different search.</li>';
    return;
  }

  for (const result of results) {
    const li = document.createElement('li');
    li.className = 'search-result-item';

    const nameEl = document.createElement('div');
    nameEl.className = 'search-result-item__name';
    nameEl.textContent = result.display_name.split(',')[0];

    const detailEl = document.createElement('div');
    detailEl.className = 'search-result-item__detail';
    detailEl.textContent = result.display_name;

    li.appendChild(nameEl);
    li.appendChild(detailEl);

    li.addEventListener('click', () => {
      const coords = [parseFloat(result.lat), parseFloat(result.lon)];
      getMap().setView(coords, 16);
      showPlaceCard(coords, nameEl.textContent);
      clearResults();
    });

    resultsList.appendChild(li);
  }
}

async function handleSearchSubmit(event) {
  if (event.key !== 'Enter') return;

  const query = searchInput.value.trim();
  if (!query) return;

  resultsList.innerHTML = '<li class="empty-state">Searching…</li>';

  try {
    const results = await searchPlaces(query);
    renderResults(results);
  } catch (err) {
    console.error(err);
    resultsList.innerHTML = '<li class="empty-state">Search failed. Please try again.</li>';
  }
}

searchInput.addEventListener('keydown', handleSearchSubmit);

async function handleMapClick(event) {
  const { lat, lng } = event.latlng;
  let name;
  try {
    name = await reverseGeocode(lat, lng);
  } catch (err) {
    console.error(err);
    name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
  showPlaceCard([lat, lng], name.split(',')[0]);
}

function attachMapClickWhenReady() {
  const map = getMap();
  if (map) {
    map.on('click', handleMapClick);
  } else {
    setTimeout(attachMapClickWhenReady, 200);
  }
}
attachMapClickWhenReady();

document.addEventListener('routesync:go-to-place', async (event) => {
  const place = event.detail;
  let coords = place.coords;

  if (!coords) {
    try {
      const results = await searchPlaces(place.name);
      if (results.length === 0) {
        window.alert(`Couldn't find "${place.name}" on the map.`);
        return;
      }
      coords = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
    } catch (err) {
      console.error(err);
      window.alert('Search failed. Please try again.');
      return;
    }
  }

  getMap().setView(coords, 16);
  showPlaceCard(coords, place.name);
});