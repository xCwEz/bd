"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { services } from "@/lib/data";
import { useEnvironnement } from "@/lib/quality";
import { useDansLeViewport, useReveal } from "@/lib/useReveal";
import VisuelParallaxe from "@/components/ui/VisuelParallaxe";

const CanvasServices = dynamic(
  () => import("@/components/three/CanvasServices"),
  { ssr: false }
);

const EmplacementVisuel = dynamic(
  () => import("@/components/three/EmplacementVisuel"),
  { ssr: false }
);

function BlocService({ service, index, avec3D, image, mouvementReduit }) {
  const [ref, visible] = useReveal();
  const cote = index % 2 === 0 ? "gauche" : "droite";
  const etat = visible ? " reveal--visible" : "";

  // Une image fournie prime toujours sur le visuel procédural : celui-ci n'est
  // qu'un repli tant que le fichier n'existe pas dans public/services/.
  const modificateur = image
    ? " service__visuel--image"
    : avec3D
      ? ""
      : " service__visuel--plat";

  return (
    <li ref={ref} className={`service service--${cote}`}>
      <div
        className={`service__visuel${modificateur} reveal${etat} reveal--retard-2`}
      >
        {image ? (
          <VisuelParallaxe
            src={image}
            alt={service.alt}
            prioritaire={index === 0}
            immobile={mouvementReduit}
          />
        ) : avec3D ? (
          <EmplacementVisuel type={service.visuel} index={index + 1} />
        ) : null}
      </div>

      <div className="service__corps">
        <span className={`service__numero reveal${etat}`}>
          {service.numero} <span aria-hidden="true">—</span>
        </span>
        <span className={`service__filet reveal${etat}`} aria-hidden="true" />
        <h3 className={`service__titre reveal${etat}`}>{service.titre}</h3>
        <p className={`service__accroche reveal${etat} reveal--retard`}>
          {service.accroche}
        </p>
        <p className={`service__texte reveal${etat} reveal--retard`}>
          {service.texte}
        </p>
      </div>
    </li>
  );
}

export default function Services({ images = {} }) {
  const environnement = useEnvironnement();
  const [section, dansLeViewport] = useDansLeViewport("25% 0px 25% 0px");
  const [canvasMonte, setCanvasMonte] = useState(false);

  // Le canvas des visuels procéduraux ne se monte que s'il reste au moins un
  // bloc sans image. Les cinq images fournies, aucun contexte WebGL n'est
  // ouvert pour cette section.
  const besoinProcedural = services.some((service) => !images[service.id]);
  const avec3D = environnement.pret && environnement.webgl && besoinProcedural;

  useEffect(() => {
    if (!avec3D) return undefined;
    const identifiant = requestAnimationFrame(() => setCanvasMonte(true));
    return () => cancelAnimationFrame(identifiant);
  }, [avec3D]);

  return (
    <section id="services" ref={section} className="services section">
      {canvasMonte ? (
        <CanvasServices
          actif={dansLeViewport}
          dpr={environnement.dpr}
          mobile={environnement.mobile}
          mouvementReduit={environnement.mouvementReduit}
        />
      ) : null}

      <div className="enveloppe">
        <header className="services__entete">
          <span className="label">Ce que nous faisons</span>
          <h2>
            Cinq métiers,
            <br />
            un seul niveau d&rsquo;exigence
          </h2>
          <p className="services__chapeau">
            L&rsquo;atelier travaille sur rendez-vous, avec un interlocuteur
            unique du devis à la restitution. Chaque intervention est
            documentée, chiffrée avant démontage, et contrôlée avant de vous
            rendre les clés.
          </p>
        </header>

        <ol className="services__liste">
          {services.map((service, index) => (
            <BlocService
              key={service.id}
              service={service}
              index={index}
              avec3D={avec3D}
              image={images[service.id]}
              mouvementReduit={environnement.mouvementReduit}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
