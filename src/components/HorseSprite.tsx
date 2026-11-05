import React from 'react';
import { HorseColorTheme } from '../types/probability';

interface HorseSpriteProps {
  horseNumber: number;
  color: HorseColorTheme;
  isMoving?: boolean;
  isWinner?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const HorseSprite: React.FC<HorseSpriteProps> = ({
  horseNumber,
  color,
  isMoving = false,
  isWinner = false,
  size = 'md',
}) => {
  const dimensions = {
    sm: { width: 52, height: 36, scale: 0.75 },
    md: { width: 68, height: 46, scale: 0.95 },
    lg: { width: 84, height: 56, scale: 1.15 },
  }[size];

  return (
    <div className={`relative flex items-center select-none ${isMoving ? 'animate-gallop' : ''}`}>
      {/* Dynamic SVG Horse + Jockey */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 100 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-md overflow-visible"
      >
        {/* Shadow */}
        <ellipse cx="48" cy="62" rx="36" ry="4" fill="rgba(0,0,0,0.3)" />

        {/* Back Legs (darker shading) */}
        <g stroke="#3D2314" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          {/* Back Left Leg */}
          <path d={isMoving ? "M30 42 L22 55 L16 60" : "M30 42 L24 54 L20 61"} />
          {/* Front Left Leg */}
          <path d={isMoving ? "M68 40 L76 48 L86 52" : "M68 40 L74 52 L78 61"} />
        </g>

        {/* Horse Body */}
        <path
          d="M26 38 C22 30, 26 24, 38 24 C50 24, 64 26, 72 32 C78 36, 76 44, 70 46 C58 48, 38 48, 26 38 Z"
          fill="#5B381E"
        />

        {/* Horse Neck and Head */}
        <path
          d="M62 30 L74 14 C76 11, 80 11, 84 14 L92 18 C94 20, 93 23, 89 25 L78 28 Z"
          fill="#5B381E"
        />

        {/* Muzzle */}
        <path d="M89 17 L94 19 L92 23 L87 22 Z" fill="#3D2314" />

        {/* Ear */}
        <polygon points="76,13 79,7 81,13" fill="#5B381E" />

        {/* Eye */}
        <circle cx="83" cy="16" r="1.5" fill="#1C1917" />
        <circle cx="83.5" cy="15.5" r="0.5" fill="#FFFFFF" />

        {/* Mane */}
        <path
          d="M71 14 C68 18, 66 22, 63 28 C66 26, 68 22, 72 18 Z"
          fill="#29180C"
        />

        {/* Tail (swaying) */}
        <path
          d={isMoving ? "M24 32 C12 30, 4 38, 2 46 C6 43, 16 38, 24 36 Z" : "M24 32 C14 34, 8 44, 8 52 C12 46, 18 42, 24 36 Z"}
          fill="#29180C"
        />

        {/* Front Legs (foreground) */}
        <g stroke="#5B381E" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Back Right Leg */}
          <path d={isMoving ? "M36 42 L38 52 L44 60" : "M36 42 L34 53 L32 61"} />
          {/* Front Right Leg */}
          <path d={isMoving ? "M66 40 L60 50 L52 56" : "M66 40 L65 52 L62 61"} />
        </g>

        {/* Saddle Pad (with horse color theme) */}
        <rect
          x="40"
          y="26"
          width="20"
          height="14"
          rx="2"
          fill={color.primary}
          stroke="#FFFFFF"
          strokeWidth="1.2"
        />

        {/* Horse Bib Number inside saddle pad */}
        <text
          x="50"
          y="36"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="9"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          {horseNumber}
        </text>

        {/* Jockey Body / Jersey */}
        <path
          d="M48 20 C46 16, 52 14, 58 17 L62 25 L48 25 Z"
          fill={color.primary}
          stroke="#FFFFFF"
          strokeWidth="1"
        />

        {/* Jockey Cap / Helmet */}
        <path
          d="M52 13 C52 9, 60 9, 61 13 L65 14 L52 14 Z"
          fill={color.secondary ? color.primary : '#FFFFFF'}
        />

        {/* Jockey Goggles / Face */}
        <ellipse cx="58" cy="14" rx="3" ry="2" fill="#E2E8F0" stroke="#0F172A" strokeWidth="0.8" />

        {/* Jockey Arm & Reins */}
        <path d="M54 20 L66 22 L75 22" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M75 22 L86 21" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2,2" fill="none" />

        {/* Winner Crown indicator if won */}
        {isWinner && (
          <g transform="translate(48, -4)">
            <polygon points="0,8 3,0 7,5 11,0 14,8" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
            <circle cx="3" cy="1" r="1" fill="#EF4444" />
            <circle cx="7" cy="5" r="1" fill="#3B82F6" />
            <circle cx="11" cy="1" r="1" fill="#10B981" />
          </g>
        )}
      </svg>
    </div>
  );
};
