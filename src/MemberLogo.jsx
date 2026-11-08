import { useId, useMemo } from 'react';

export default function MemberLogo({ item }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const html = useMemo(() => {
    let markup = item.html;
    for (const match of item.html.matchAll(/\bid="([^"]+)"/g)) {
      const id = match[1], unique = uid + '-' + id;
      markup = markup.replaceAll('id="' + id + '"', 'id="' + unique + '"')
        .replaceAll('url(#' + id + ')', 'url(#' + unique + ')')
        .replaceAll('href="#' + id + '"', 'href="#' + unique + '"');
    }
    return markup;
  }, [item, uid]);
  return <span className={'member-logo ' + item.className} aria-hidden="true"><span dangerouslySetInnerHTML={{ __html: html }}/></span>;
}
