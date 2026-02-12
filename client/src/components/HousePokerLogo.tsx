/**
 * HousePokerLogo — Uses AI-generated premium logo (nano banana)
 * No SVG drawing — uses the generated PNG with transparent background
 */
import { ASSETS } from '@/lib/assets';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function HousePokerLogo({ size = 80, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src={ASSETS.logo}
        alt="HOUSE POKER"
        width={size}
        height={size}
        className="object-contain"
        style={{
          filter: 'drop-shadow(0 4px 20px rgba(212,175,55,0.3))',
        }}
      />
      {showText && (
        <div className="text-center mt-1">
          <div className="font-display text-lg font-bold tracking-[0.15em] gold-text leading-none">
            HOUSE POKER
          </div>
          <div className="text-[7px] tracking-[0.35em] uppercase text-gray-500 mt-0.5">
            Premium Club
          </div>
        </div>
      )}
    </div>
  );
}

/* Compact version for HUD/header — uses compact logo */
export function HousePokerLogoCompact({ size = 28 }: { size?: number }) {
  return (
    <img
      src={ASSETS.logoCompact}
      alt="HP"
      width={size}
      height={size}
      className="object-contain"
      style={{
        filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.25))',
      }}
    />
  );
}
