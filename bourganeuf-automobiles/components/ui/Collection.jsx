"use client";

import { vehicules } from "@/lib/data";
import { useEnvironnement } from "@/lib/quality";
import { useReveal } from "@/lib/useReveal";
import VisuelParallaxe from "@/components/ui/VisuelParallaxe";

const formatEuros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const formatKm = new Intl.NumberFormat("fr-FR");

/**
 * Une vraie photo prime toujours. Tant que `photos` est vide — le cas de
 * toutes les fiches tant que le client n'a rien transmis — la fiche affiche
 * un repli procédural : nom du véhicule, mention explicite « photo à venir ».
 * C'est la seule exception à la règle « aucune photo » du reste du site.
 */
function FicheVehicule({ vehicule, index, mouvementReduit }) {
  const [ref, visible] = useReveal();
  const etat = visible ? " reveal--visible" : "";
  const photo = vehicule.photos[0];

  return (
    <li ref={ref} className={`vehicule reveal${etat}`}>
      <div className="vehicule__visuel">
        {photo ? (
          <VisuelParallaxe
            src={photo}
            alt={`${vehicule.marque} ${vehicule.modele}, ${vehicule.annee}`}
            prioritaire={index === 0}
            immobile={mouvementReduit}
          />
        ) : (
          <div className="vehicule__attente">
            <span className="vehicule__attente-nom" aria-hidden="true">
              {vehicule.marque}
              <br />
              {vehicule.modele}
            </span>
            <span className="vehicule__attente-label">Photo à venir</span>
          </div>
        )}
      </div>

      <div className="vehicule__corps">
        <div className="vehicule__entete">
          <h3 className="vehicule__titre">
            {vehicule.marque} {vehicule.modele}
          </h3>
          <span className="vehicule__prix">
            {formatEuros.format(vehicule.prix)}
          </span>
        </div>

        <ul className="vehicule__specs">
          <li>{vehicule.annee}</li>
          <li>{formatKm.format(vehicule.kilometrage)} km</li>
          <li>{vehicule.carburant}</li>
          <li>{vehicule.transmission}</li>
        </ul>

        <p className="vehicule__description">{vehicule.description}</p>

        <a className="vehicule__cta" href="#contact">
          Se renseigner <span aria-hidden="true">→</span>
        </a>
      </div>
    </li>
  );
}

export default function Collection() {
  const environnement = useEnvironnement();
  const [ref, visible] = useReveal({ seuil: 0.08 });
  const etat = visible ? " reveal--visible" : "";

  return (
    <section id="collection" ref={ref} className="collection section">
      <div className="enveloppe">
        <header className="collection__entete">
          <span className="label">Le stock</span>
          <h2 className={`reveal${etat}`}>Vendues comme on les entretient.</h2>
          <p className={`collection__chapeau reveal${etat} reveal--retard`}>
            Chaque véhicule passe par notre atelier avant de rejoindre la
            cour : contrôle mécanique complet, historique vérifié, et le même
            soin que sur les voitures qui nous sont confiées en réparation.
          </p>
        </header>

        <ul className="collection__liste">
          {vehicules.map((vehicule, index) => (
            <FicheVehicule
              key={vehicule.id}
              vehicule={vehicule}
              index={index}
              mouvementReduit={environnement.mouvementReduit}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
