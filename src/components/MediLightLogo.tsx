import React from 'react';

interface MediLightLogoProps {
  size?: number;
  className?: string;
}

export const MediLightLogo: React.FC<MediLightLogoProps> = ({ size = 44, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="MEDILIGHT logo showing two tablets forming a heart"
    >
      {/* Subtle dark obsidian badge backing with lavender hairline border */}
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="13"
        fill="#12111A"
        stroke="#C4B5FD"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />

      {/* Right tablet forming right half of the heart (placed behind for crisp overlap) */}
      <g transform="translate(29.02 25.43) rotate(42)">
        <rect
          x="-7"
          y="-14.5"
          width="14"
          height="29"
          rx="7"
          fill="#A78BFA"
          stroke="#09090D"
          strokeWidth="1.5"
        />
        {/* Tablet score line */}
        <line
          x1="-5.2"
          y1="0"
          x2="5.2"
          y2="0"
          stroke="#12111A"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        {/* Subtle highlight on top lobe */}
        <path
          d="M-3.5 -9.5 C-3.5 -11.4 -1.8 -12.5 0 -12.5"
          stroke="#EDE9FE"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Left tablet forming left half of the heart */}
      <g transform="translate(18.98 25.43) rotate(-42)">
        <rect
          x="-7"
          y="-14.5"
          width="14"
          height="29"
          rx="7"
          fill="#E9D5FF"
          stroke="#09090D"
          strokeWidth="2"
        />
        {/* Tablet score line */}
        <line
          x1="-5.2"
          y1="0"
          x2="5.2"
          y2="0"
          stroke="#12111A"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        {/* Subtle inner sheen */}
        <path
          d="M-3.5 -9.5 C-3.5 -11.4 -1.8 -12.5 0 -12.5"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>
    </svg>
  );
};
