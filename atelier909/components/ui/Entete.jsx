"use client";

import { HANDLE_OPERATEUR } from "@/lib/config";

export default function Entete() {
  return (
    <header className="entete">
      <div className="entete-ligne">
        <span className="entete-pastille chrome-surface" />
        <span className="entete-titre mono">ATELIER 909</span>
        <button
          type="button"
          className="entete-fermer mono"
          onClick={() => window.Telegram?.WebApp?.close()}
        >
          FERMER
        </button>
      </div>
      <div className="ligne-session">
        <div className="ligne-session-gauche">
          <span className="ligne-session-label mono">SESSION CHIFFRÉE</span>
          <span className="ligne-session-handle mono">{HANDLE_OPERATEUR}</span>
        </div>
        <span className="pastille">
          <span className="point-etat" />
          <span className="mono" style={{ fontSize: 10, color: "var(--texte-secondaire)" }}>
            E2E ACTIF
          </span>
        </span>
      </div>
    </header>
  );
}
