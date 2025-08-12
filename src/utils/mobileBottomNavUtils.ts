// Utility functions for managing bottom navigation visibility on mobile

export const hideBottomNavigation = () => {
  const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement;
  if (bottomNav) {
    bottomNav.style.display = 'none';
    bottomNav.setAttribute('data-hidden-by-modal', 'true');
  }
};

export const showBottomNavigation = () => {
  const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement;
  if (bottomNav && bottomNav.getAttribute('data-hidden-by-modal') === 'true') {
    bottomNav.style.display = '';
    bottomNav.removeAttribute('data-hidden-by-modal');
  }
};

export const isBottomNavigationHidden = (): boolean => {
  const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement;
  return bottomNav?.getAttribute('data-hidden-by-modal') === 'true';
};