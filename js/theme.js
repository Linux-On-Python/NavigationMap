/*
  theme.js
  --------
  Dark/light mode: defaults to the user's OS preference (handled purely
  in CSS via prefers-color-scheme — see variables.css), and lets them
  manually override that with the toggle button in the header. The
  manual choice is remembered across visits via localStorage.
*/

import { getItem, setItem } from './storage.js';

const root = document.documentElement;
const toggleBtn = document.getElementById('theme-toggle');
const iconPath = document.getElementById('theme-icon').querySelector('path');

const MOON_PATH = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';
const SUN_PATH =
  'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42';

function applyTheme(theme) {
  // theme is 'light', 'dark', or null (= follow system preference)
  if (theme) {
    root.setAttribute('data-theme', theme);
  } else {
    root.removeAttribute('data-theme');
  }

  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme ? theme === 'dark' : systemPrefersDark;
  iconPath.setAttribute('d', isDark ? SUN_PATH : MOON_PATH);
}

// Restore whatever the person last chose (or null = system default)
const savedTheme = getItem('theme', null);
applyTheme(savedTheme);

toggleBtn.addEventListener('click', () => {
  const current = getItem('theme', null);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentlyDark = current ? current === 'dark' : systemPrefersDark;

  const next = currentlyDark ? 'light' : 'dark';
  setItem('theme', next);
  applyTheme(next);
});