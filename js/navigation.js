/*
  navigation.js
  -------------
  The real turn-by-turn engine. Once routing.js draws a route and calls
  startNavigation(route), this file:
    1. Watches your actual live position (navigator.geolocation.watchPosition)
    2. Works out real distance to the next maneuver from OSRM's route steps
    3. Keeps the nav banner text updated ("in 150m, turn left onto X")
    4. Tells voice.js when to have Tails actually say something

  This only needs the OSRM route object already returned by routing.js —
  no extra network requests are made here.
*/

import { announce } from './voice.js';

const navBanner = document.getElementById('nav-banner');
const instructionEl = document.getElementById('nav-instruction');
const streetEl = document.getElementById('nav-street');

const ARRIVAL_RADIUS_M = 15;
const ANNOUNCE_RADIUS_M = 150;

let steps = [];
let currentStepIndex = 0;
let watchId = null;
let announcedCurrentStep = false;

function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters) {
  if (meters < 30) return 'now';
  if (meters < 1000) return `in ${Math.round(meters / 10) * 10}m`;
  return `in ${(meters / 1000).toFixed(1)}km`;
}

function describeManeuver(step) {
  const { type, modifier } = step.maneuver;

  if (type === 'arrive') return { text: "You've arrived", eventKey: 'arrive' };
  if (type === 'depart') return { text: 'Starting the trip', eventKey: 'start' };

  if (type === 'turn' || type === 'end of road') {
    if (modifier && modifier.includes('left')) return { text: 'Turn left', eventKey: 'turn-left' };
    if (modifier && modifier.includes('right')) return { text: 'Turn right', eventKey: 'turn-right' };
    return { text: 'Continue', eventKey: 'continue' };
  }

  if (type === 'roundabout' || type === 'rotary') {
    return { text: 'Take the roundabout', eventKey: 'roundabout' };
  }

  if (type === 'merge' || type === 'fork') {
    const text = modifier && modifier.includes('left') ? 'Keep left' : 'Keep right';
    return { text, eventKey: 'continue' };
  }

  return { text: 'Continue straight', eventKey: 'continue' };
}

function updateBanner(step, distanceMeters) {
  const { text } = describeManeuver(step);
  instructionEl.textContent = `${formatDistance(distanceMeters)}, ${text.toLowerCase()}`;
  streetEl.textContent = step.name ? `onto ${step.name}` : '';
}

function handlePosition(position) {
  if (currentStepIndex >= steps.length) return;

  const { latitude, longitude } = position.coords;
  const step = steps[currentStepIndex];
  const [lng, lat] = step.maneuver.location;
  const distance = haversineMeters([latitude, longitude], [lat, lng]);

  updateBanner(step, distance);

  if (distance <= ANNOUNCE_RADIUS_M && !announcedCurrentStep) {
    const { eventKey } = describeManeuver(step);
    announce(eventKey, step.name ? `onto ${step.name}` : '');
    announcedCurrentStep = true;
  }

  if (distance <= ARRIVAL_RADIUS_M) {
    currentStepIndex += 1;
    announcedCurrentStep = false;
    if (currentStepIndex >= steps.length) stopNavigation();
  }
}

export function startNavigation(route) {
  if (!route || !route.legs || !route.legs[0]) {
    console.warn('No route steps available — navigation cannot start.');
    return;
  }

 steps = route.legs[0].steps || [];

  if (steps.length === 0) {
    console.warn('Route contains no navigation steps.');
    return;
  }

  currentStepIndex = 0;
  announcedCurrentStep = false;

  navBanner.classList.add('is-active');
  announce('start');

  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(
    handlePosition,
    (err) => console.warn('Could not watch position for navigation:', err),
    { enableHighAccuracy: true }
  );
}

export function stopNavigation() {
  navBanner.classList.remove('is-active');
  instructionEl.textContent = '';
  streetEl.textContent = '';
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}