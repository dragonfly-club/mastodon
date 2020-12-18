import '../styles/snowfall.scss';

(() => {
  'use strict';

  const ready = (loaded: () => void): void => {
    if (['interactive', 'complete'].indexOf(document.readyState) !== -1) {
      loaded();
    } else {
      document.addEventListener('DOMContentLoaded', loaded);
    }
  };

  ready((): void => {
    const container = document.createElement("div");
    container.classList.add("snowfall");

    const n = 250 * (screen.width * screen.height) / (1920 * 1080);

    for (let i = 0; i < Math.min(n, 250); i++) {
      const flake = document.createElement("div");
      flake.classList.add("snowflake");
      container.appendChild(flake);
    }

    document.querySelector("body")?.appendChild(container);
  });
})();
