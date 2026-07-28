export default function Logo({ className = "", size = "default" }) {
  const dims = {
    sm: { w: 170, h: 36 },
    md: { w: 220, h: 44 },
    lg: { w: 300, h: 60 },
  };
  const { w, h } = dims[size] || dims.md;

  return (
    <svg className={className} width={w} height={h} viewBox="0 0 230 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="logoPurple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B7CF8" />
          <stop offset="100%" stopColor="#6E5EF7" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="22" r="12" stroke="#D4D4D8" strokeWidth="4" fill="none" />
      <circle cx="44" cy="22" r="12" stroke="url(#logoPurple)" strokeWidth="4" fill="none" />
      <circle cx="31" cy="22" r="3" fill="#26233D" />
      <text x="62" y="31" fontFamily="Inter, -apple-system, Arial, sans-serif" fontSize="22" fontWeight="700" fill="#26233D">
        Namche<tspan fill="#8B7CF8">points</tspan>
      </text>
    </svg>
  );
}
