// Preserve shared archive fragments, including links inside version snapshots.
(() => {
  const follow = () => {
    if (/^#(?:daily|topics|discussions|events|join|discussion-\d+)$/.test(location.hash)) {
      location.replace(new URL('community.html' + location.search + location.hash, location.href).href);
    }
  };
  follow();
  window.addEventListener('hashchange', follow);
})();
