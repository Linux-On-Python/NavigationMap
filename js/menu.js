/*
  menu.js
  -------
  Opens/closes the hamburger dropdown menu, and closes it when the person
  clicks outside it or presses Escape. The individual menu items
  (History, Offline maps, Voice preferences, About) don't do anything
  yet — that's the next module to build (screens/ fragments swapped into
  <main>) — this file only owns the open/close behavior.
*/

const menuToggleBtn = document.getElementById('menu-toggle');
const menu = document.getElementById('hamburger-menu');

function openMenu() {
  menu.classList.add('is-open');
  menuToggleBtn.setAttribute('aria-expanded', 'true');
}

function closeMenu() {
  menu.classList.remove('is-open');
  menuToggleBtn.setAttribute('aria-expanded', 'false');
}

menuToggleBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  const isOpen = menu.classList.contains('is-open');
  isOpen ? closeMenu() : openMenu();
});

// Close when clicking anywhere outside the menu
document.addEventListener('click', (event) => {
  if (!menu.contains(event.target)) closeMenu();
});

// Close on Escape for keyboard users
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

// Placeholder wiring for each item — will route to real screens later
menu.querySelectorAll('.hamburger-menu__item').forEach((item) => {
  item.addEventListener('click', () => {
    const screen = item.dataset.screen;
    console.log(`Open screen: ${screen} (not yet built)`);
    closeMenu();
  });
});