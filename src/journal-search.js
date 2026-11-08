export function findTextMatches(text, query) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  const folded = text.toLocaleLowerCase();
  // Case folding can expand a character; keep ranges in the original text.
  let offsets;
  if (folded.length !== text.length) {
    offsets = [];
    let start = 0;
    for (const character of text) {
      const end = start + character.length;
      for (let i = 0; i < character.toLocaleLowerCase().length; i++) offsets.push({ start, end });
      start = end;
    }
  }
  const matches = [];
  let cursor = 0;
  let index;
  while ((index = folded.indexOf(needle, cursor)) !== -1) {
    const start = offsets ? offsets[index].start : index;
    const end = offsets ? offsets[index + needle.length - 1].end : index + needle.length;
    const previous = matches.at(-1);
    if (previous && start < previous.end) previous.end = Math.max(previous.end, end);
    else matches.push({ start, end });
    cursor = index + needle.length;
  }
  return matches;
}

export function discussionSearchPreview(item, query) {
  if (!query.trim() || ['tag', 'question', 'quote'].some(key => findTextMatches(item[key], query).length)) return null;
  for (const field of ['detail', 'conclusion']) {
    const text = item[field];
    const match = findTextMatches(text, query)[0];
    if (!match) continue;
    let start = 0;
    let end = text.length;
    for (const separator of text.matchAll(/[。！？；\n]/g)) {
      if (separator.index < match.start) start = separator.index + 1;
      else if (separator.index + 1 >= match.end) { end = separator.index + 1; break; }
    }
    // Use a complete source sentence, never a generated search summary.
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }
  return null;
}
