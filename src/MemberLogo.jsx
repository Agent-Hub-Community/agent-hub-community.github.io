export default function MemberLogo({ item }) {
  return <span className={item.className ? 'member-logo ' + item.className : 'member-logo'} aria-hidden="true">
    <span><img src={item.src} alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async"/></span>
  </span>;
}
