/*
  storage.js
  ----------
  Small shared wrapper around localStorage, used by places.js and
  journeys.js. Centralizing this in one file means if we later swap to
  IndexedDB (e.g. once offline-areas.js needs to store larger tile data),
  only this file has to change — every other module keeps calling
  getItem/setItem the same way.
*/

const PREFIX = 'routesync:';

export function getItem(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`storage: failed to read "${key}"`, err);
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`storage: failed to write "${key}"`, err);
    return false;
  }
}