/*
  map.js
  ------
  Initializes the real Leaflet map: gets the user's actual location via
  the browser's Geolocation API, centers the map there, and loads free
  OpenStreetMap tiles (no API key, no cost). Falls back to a default
  location if the person denies location access or it's unavailable.

  Uses watchPosition (continuous tracking) rather than a single one-time
  check — this matters because the first location fix is often the
  least accurate one. Watching lets the blue dot correct itself as
  better readings come in, and also shows a translucent accuracy circle
  around it.

  Exports getMap() so routing.js can add route lines and destination
  markers to this same map instance, and getUserLocation() so routing.js
  knows where to start a route from.
*/

const mapStatusEl = document.getElementById('map-status');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');

const FALLBACK_COORDS = [18.4861, -69.9312];
const DEFAULT_ZOOM = 16;

let map;
let userLocation;
let userMarker;
let accuracyCircle;
let mapInitialized = false;
let watchId = null;

function initMap(center, statusMessage) {
  if (statusMessage) {
    mapStatusEl.textContent = statusMessage;
  } else {
    mapStatusEl.remove();
  }

  map = L.map('map', {
    zoomControl: false,
  }).setView(center, DEFAULT_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  accuracyCircle = L.circle(center, {
    radius: 30,
    color: '#4fc3f7',
    weight: 1,
    fillColor: '#4fc3f7',
    fillOpacity: 0.15,
  }).addTo(map);

  userMarker = L.circleMarker(center, {
    radius: 7,
    color: '#ffffff',
    weight: 2,
    fillColor: '#4fc3f7',
    fillOpacity: 1,
  }).addTo(map);

  zoomInBtn.addEventListener('click', () => map.zoomIn());
  zoomOutBtn.addEventListener('click', () => map.zoomOut());

  mapInitialized = true;

  // IMPORTANT: Leaflet calculates its pixel size once at creation and has
  // no built-in way to notice if its container later resizes (browser
  // window resized, the side panel's responsive layout kicking in at a
  // breakpoint, dev tools opened/closed, orientation change, etc.).
  // Without telling it explicitly, its tile grid goes stale — this is
  // what causes the map to render corrupted/zoomed-out ("world map
  // repeating" pattern) after any layout change. ResizeObserver watches
  // the actual container element, which catches CSS/layout-driven
  // resizes that a plain window "resize" listener would miss.
  const mapContainerEl = document.querySelector('.map-container');
  const resizeObserver = new ResizeObserver(() => {
    map.invalidateSize();
  });
  resizeObserver.observe(mapContainerEl);

  // Also correct for the very first paint, in case the container's final
  // size wasn't settled yet at the instant the map was created.
  setTimeout(() => map.invalidateSize(), 100);
}

function updateUserPosition(center, accuracy) {
  userLocation = center;
  userMarker.setLatLng(center);
  accuracyCircle.setLatLng(center);
  if (accuracy) accuracyCircle.setRadius(accuracy);
}

function handlePositionUpdate(position) {
  const { latitude, longitude, accuracy } = position.coords;
  const center = [latitude, longitude];

  if (!mapInitialized) {
    userLocation = center;
    initMap(center, null);
    accuracyCircle.setRadius(accuracy);
  } else {
    updateUserPosition(center, accuracy);
  }
}

function handleGeolocationError() {
  if (!mapInitialized) {
    userLocation = FALLBACK_COORDS;
    initMap(FALLBACK_COORDS, null);
  }
  console.warn('Location unavailable or inaccurate — showing best-known position. ' +
    'For accurate results, use a phone with GPS/precise location enabled, outdoors.');
}

if ('geolocation' in navigator) {
  watchId = navigator.geolocation.watchPosition(handlePositionUpdate, handleGeolocationError, {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 0,
  });
} else {
  handleGeolocationError();
}

export function getMap() {
  return map;
}

export function getUserLocation() {
  return userLocation;
}