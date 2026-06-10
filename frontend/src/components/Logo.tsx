interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  variant?: "default" | "light";
}

export default function Logo({ size = 96, showWordmark = true, variant = "default" }: LogoProps) {
  const textColor = variant === "light" ? "#ffffff" : "var(--text)";
  const uColor = variant === "light" ? "#9fe6ff" : "var(--accent2)";

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ichoiceLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7CC4FF" />
            <stop offset="100%" stopColor="#1B4FD6" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="url(#ichoiceLogoGrad)" />
        {/* eye dot */}
        <circle cx="32" cy="33" r="6" fill="#fff" />
        {/* smile / U mark */}
        <path
          d="M28 44 C28 64 40 74 54 74 C68 74 76 62 76 46"
          stroke="#fff"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        {/* "go" arrow */}
        <path d="M58 26 L80 18 L72 40 L65 30 Z" fill="#fff" />
      </svg>
      {showWordmark && (
        <div
          className="font-black tracking-tight"
          style={{ fontSize: size * 0.32, color: textColor, lineHeight: 1 }}
        >
          iChoice <span style={{ color: uColor }}>u</span>Go
        </div>
      )}
    </div>
  );
}
