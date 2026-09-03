(() => {
  'use strict';

  // Compatibility loader.
  // The previous monolithic runtime contained a syntax error in the magic-pattern mini-game.
  // Keep the game entry point stable and load the verified renderer instead.
  const script = document.createElement('script');
  script.src = './renderer.js';
  script.async = false;
  script.onerror = () => {
    document.body.innerHTML = '<main style="font:16px monospace;padding:40px;color:#ff6b8a;background:#10131b"><h1>GAME LOAD ERROR</h1><p>renderer.js could not be loaded.</p></main>';
  };
  document.body.appendChild(script);
})();
