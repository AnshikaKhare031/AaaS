import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'dark' | 'light' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  clickable?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  size = 'md',
  showSubtitle = true,
  clickable = true,
  className = '',
}) => {
  const primaryColor =
    variant === 'light' ? '#F8F5F0' : variant === 'gold' ? '#C6A15B' : '#3D2E24';
  const accentColor =
    variant === 'light' ? '#EADCCF' : variant === 'gold' ? '#3D2E24' : '#C6A15B';
  const textColor =
    variant === 'light' ? '#FFFFFF' : variant === 'gold' ? '#3D2E24' : '#3D2E24';
  const subtextColor =
    variant === 'light' ? '#DDD6CF' : variant === 'gold' ? '#5A4335' : '#7B6656';

  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-xl', sub: 'text-[9px] tracking-[0.25em]' },
    md: { icon: 'w-9 h-9', text: 'text-2xl', sub: 'text-[10px] tracking-[0.3em]' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl', sub: 'text-xs tracking-[0.35em]' },
    xl: { icon: 'w-16 h-16', text: 'text-4xl', sub: 'text-sm tracking-[0.4em]' },
  }[size];

  const content = (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Handcrafted Crocheting Hands & Hook Vector Emblem */}
      <svg
        className={`${sizeClasses.icon} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AaaS Crochet Emblem"
      >
        {/* Subtle Botanical Leaf Laurel Accent */}
        <path
          d="M 50 12 C 55 18 53 26 48 30 C 44 26 43 18 50 12 Z"
          fill={accentColor}
          opacity="0.85"
        />
        <path
          d="M 50 12 C 45 18 47 26 52 30 C 56 26 57 18 50 12 Z"
          fill={accentColor}
          opacity="0.6"
        />

        {/* Left Hand holding working yarn loops */}
        <path
          d="M 18 64 C 20 54 26 48 36 48 C 40 48 44 51 46 56 C 44 60 40 64 34 66 C 26 69 20 72 18 64 Z"
          stroke={primaryColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Left Hand Fingers guiding the yarn */}
        <path
          d="M 33 48 C 36 42 41 42 45 46 C 47 48 48 53 45 57"
          stroke={primaryColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Crochet Hook Tool with Ergonomic Grip and Hook Head */}
        <path
          d="M 78 26 L 44 68"
          stroke={accentColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Hook Head */}
        <path
          d="M 44 68 C 41 72 37 70 38 66 C 39 63 42 63 45 66"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Hand holding crochet hook */}
        <path
          d="M 82 42 C 76 40 70 45 68 52 C 67 56 70 62 76 64 C 82 66 86 60 84 52 Z"
          stroke={primaryColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 68 52 C 62 55 58 60 62 65 C 66 69 72 67 76 64"
          stroke={primaryColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Active Flowing Yarn Stitches linking the hands */}
        <path
          d="M 24 72 C 30 76 34 82 42 82 C 50 82 52 74 60 74 C 68 74 72 80 80 80"
          stroke={accentColor}
          strokeWidth="2.8"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
        {/* Active Stitch Loop on Hook */}
        <path
          d="M 40 64 C 38 58 44 54 48 58 C 50 61 46 66 43 65"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Typography: AaaS + HANDMADE CROCHET */}
      <div className="flex flex-col">
        <span
          className={`font-serif font-bold ${sizeClasses.text} tracking-wider leading-none transition-colors duration-200`}
          style={{ color: textColor }}
        >
          AaaS
        </span>
        {showSubtitle && (
          <span
            className={`font-sans font-semibold uppercase mt-1 ${sizeClasses.sub}`}
            style={{ color: subtextColor }}
          >
            Handmade Crochet
          </span>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link to="/" className="inline-block" title="AaaS - Handmade Crochet">
        {content}
      </Link>
    );
  }

  return content;
};
