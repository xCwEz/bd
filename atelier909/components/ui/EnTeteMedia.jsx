"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MediaPlaceholder from "./MediaPlaceholder";

export default function EnTeteMedia({ produit }) {
  const router = useRouter();
  const mediaPrincipal = produit.medias?.[0];
  const estVideo = mediaPrincipal?.type === "video";

  useEffect(() => {
    const backButton = window.Telegram?.WebApp?.BackButton;
    if (!backButton) return;
    const retour = () => router.back();
    backButton.show();
    backButton.onClick(retour);
    return () => {
      backButton.offClick(retour);
      backButton.hide();
    };
  }, [router]);

  return (
    <div className="media-fiche">
      <MediaPlaceholder graine={0} cle={mediaPrincipal?.cle} />
      <button type="button" className="media-fiche-retour" onClick={() => router.back()} aria-label="Retour">
        ←
      </button>
      <span className="media-fiche-authentifie pastille">
        <span className="point-etat" />
        <span className="mono" style={{ fontSize: 10, color: "var(--texte-secondaire)" }}>
          AUTHENTIFIÉ
        </span>
      </span>
      {estVideo && (
        <div className="media-fiche-centre">
          <span className="media-fiche-cercle" />
          <span className="media-fiche-lecture">
            <span className="media-fiche-lecture-triangle" />
          </span>
        </div>
      )}
      {estVideo && (
        <span className="media-fiche-legende mono">
          VIDÉO 0:{String(mediaPrincipal.duree).padStart(2, "0")} · SANS SON
        </span>
      )}
    </div>
  );
}
