// Fragments from the retired community page land on the homepage's discussions. #join and #discussion-N exist
// on the homepage itself (the join block, and the discussion sky, which opens the numbered discussion).
(() => {
  const follow = () => {
    if (/^#(?:daily|topics|discussions|events)$/.test(location.hash)) location.replace('#collaborate');
  };
  follow();
  window.addEventListener('hashchange', follow);
})();
