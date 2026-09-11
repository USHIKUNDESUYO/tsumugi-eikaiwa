export default function Avatar() {
  return (
    <div className="flex items-center justify-center">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <circle cx="40" cy="40" r="40" fill="#5EEAD4" />
        
        <circle cx="40" cy="35" r="28" fill="#2DD4BF" />
        
        <ellipse cx="32" cy="32" rx="3" ry="4" fill="#0F172A" />
        <ellipse cx="48" cy="32" rx="3" ry="4" fill="#0F172A" />
        
        <path
          d="M 32 42 Q 40 46 48 42"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        <path
          d="M 22 26 Q 18 24 16 26"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 58 26 Q 62 24 64 26"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        <ellipse cx="28" cy="36" rx="4" ry="2" fill="#FCA5A5" opacity="0.6" />
        <ellipse cx="52" cy="36" rx="4" ry="2" fill="#FCA5A5" opacity="0.6" />
      </svg>
    </div>
  );
}
