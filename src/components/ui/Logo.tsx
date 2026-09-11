'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  href?: string;
}

export function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  href = '/',
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-9',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  };

  const imageContent = (
    <div className={`inline-flex items-center select-none transition-transform duration-200 hover:scale-[1.02] ${className}`}>
      {/* Exact User Uploaded Logo Image */}
      <img
        src="/logo.png"
        alt="Jël Tix - Saisissez • Réservez • Profitez"
        className={`${sizeClasses[size]} w-auto object-contain rounded-lg`}
        style={{
          // On light backgrounds it blends seamlessly with white; on dark mode it remains sharp with a subtle protective backdrop if needed
          mixBlendMode: 'normal',
        }}
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-[#0038A8] rounded-xl"
        title="Jël Tix - Accueil"
      >
        {imageContent}
      </Link>
    );
  }

  return imageContent;
}
