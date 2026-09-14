import type { Metadata, Viewport } from "next";
import React from "react";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0038A8",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://jeltix.com"),
  title: "Jël Tix | Billetterie Événements, Oscars de Vacances, Galas, Concerts & Matchs",
  description:
    "Plateforme universelle de billetterie et contrôle d'accès anti-fraude au Sénégal et en Afrique de l'Ouest. Réservez vos billets pour vos Oscars de vacances, Galas, Concerts, Festivals, Spectacles de Théâtre et Matchs en quelques clics avec Wave, Orange Money et Free Money.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Jël Tix | Saisissez • Réservez • Profitez",
    description:
      "Billetterie en ligne universelle pour tous types d'événements et contrôle d'accès sécurisé.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className="h-full"
      suppressHydrationWarning
    >
      <head>
        {/* ── Fonts: preconnect d'abord pour handshake parallèle ────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/*
          Inter: display=swap → texte visible immédiatement avec font système,
          swap vers Inter dès téléchargement terminé (zero layout blocking).
        */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          media="print"
          // @ts-ignore — onload trick standard pour non-blocking CSS load
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          />
        </noscript>

        {/*
          Material Symbols: display=optional → n'est jamais render-blocking.
          Les icônes s'affichent dès que la font est dispo, sinon fallback texte.
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=optional"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=optional"
          />
        </noscript>
      </head>
      <body
        className="min-h-screen bg-white dark:bg-[#050D1E] text-slate-900 dark:text-white font-sans antialiased flex flex-col selection:bg-[#4EED15] selection:text-[#002D8C] transition-colors duration-200"
        suppressHydrationWarning
      >
        <NavigationProgress />
        {/*
          Anti-FOUC script: reads the saved preference from localStorage first,
          then falls back to OS preference (prefers-color-scheme: dark).
          This runs synchronously before React hydration to prevent flash of wrong theme.
        */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('jeltix_theme');if(s==='dark'){document.documentElement.classList.add('dark');}else if(!s&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');localStorage.setItem('jeltix_theme','dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
