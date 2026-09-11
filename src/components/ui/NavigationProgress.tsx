'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // When pathname changes, finish the progress bar
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Intercept all internal link clicks for instant 0ms tactile feedback
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Ignore external links, new tabs, hash links, or download links
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        targetAttr === '_blank' ||
        target.hasAttribute('download')
      ) {
        return;
      }

      // If clicking same current path, ignore
      if (href === pathname || href === window.location.pathname) return;

      // Start loading bar immediately
      setLoading(true);
      setProgress(15);

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          return prev + (90 - prev) * 0.15;
        });
      }, 100);
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname, loading]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[3px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-[#4EED15] shadow-[0_0_12px_#4EED15,0_0_4px_#2CA808] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'all 200ms ease-out' : 'width 150ms ease-out',
        }}
      />
    </div>
  );
}
