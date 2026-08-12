"use client";

import { useEffect } from "react";
import Script from "next/script";

/**
 * Charge le SDK Telegram Mini App et l'initialise. Le thème reste sombre
 * fixe : on n'applique jamais `themeParams`, l'identité visuelle prime
 * (voir README, section Intégration Telegram).
 */
export default function TelegramInit() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
  }, []);

  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="afterInteractive"
      onReady={() => {
        const webApp = window.Telegram?.WebApp;
        if (!webApp) return;
        webApp.ready();
        webApp.expand();
      }}
    />
  );
}
