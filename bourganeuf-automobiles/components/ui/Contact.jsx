"use client";

import { useId, useState } from "react";
import { contact, horaires } from "@/lib/data";
import { useReveal } from "@/lib/useReveal";
import Plan from "./Plan";

const CHAMPS_VIDES = { nom: "", email: "", telephone: "", message: "" };

/** Validation côté client, doublée côté serveur dans app/api/contact. */
function valider(valeurs) {
  const erreurs = {};

  if (valeurs.nom.trim().length < 2) {
    erreurs.nom = "Indiquez votre nom.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeurs.email.trim())) {
    erreurs.email = "Cette adresse e-mail semble incomplète.";
  }
  const telephone = valeurs.telephone.replace(/[\s.\-()]/g, "");
  if (telephone && !/^\+?\d{9,15}$/.test(telephone)) {
    erreurs.telephone = "Numéro non reconnu.";
  }
  if (valeurs.message.trim().length < 12) {
    erreurs.message = "Décrivez votre besoin en quelques mots.";
  }

  return erreurs;
}

function Champ({ nom, etiquette, type = "text", valeurs, erreurs, onChange, ...reste }) {
  const identifiant = useId();
  const Balise = type === "textarea" ? "textarea" : "input";
  const enErreur = Boolean(erreurs[nom]);

  return (
    <p className={`champ${enErreur ? " champ--erreur" : ""}`}>
      <label className="champ__etiquette" htmlFor={identifiant}>
        {etiquette}
      </label>
      <Balise
        className="champ__saisie"
        id={identifiant}
        name={nom}
        type={type === "textarea" ? undefined : type}
        value={valeurs[nom]}
        onChange={(evenement) => onChange(nom, evenement.target.value)}
        aria-invalid={enErreur}
        aria-describedby={enErreur ? `${identifiant}-erreur` : undefined}
        {...reste}
      />
      <span className="champ__filet" aria-hidden="true" />
      {enErreur ? (
        <span className="champ__erreur" id={`${identifiant}-erreur`}>
          {erreurs[nom]}
        </span>
      ) : null}
    </p>
  );
}

function Formulaire() {
  const [valeurs, setValeurs] = useState(CHAMPS_VIDES);
  const [erreurs, setErreurs] = useState({});
  const [etat, setEtat] = useState("repos");

  const modifier = (nom, valeur) => {
    setValeurs((precedent) => ({ ...precedent, [nom]: valeur }));
    if (erreurs[nom]) {
      setErreurs((precedent) => {
        const suite = { ...precedent };
        delete suite[nom];
        return suite;
      });
    }
  };

  const envoyer = async (evenement) => {
    evenement.preventDefault();

    const trouvees = valider(valeurs);
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) {
      setEtat("invalide");
      return;
    }

    setEtat("envoi");
    try {
      const reponse = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valeurs),
      });

      if (!reponse.ok) {
        const corps = await reponse.json().catch(() => ({}));
        if (corps.erreurs) setErreurs(corps.erreurs);
        setEtat("erreur");
        return;
      }

      setValeurs(CHAMPS_VIDES);
      setEtat("succes");
    } catch {
      setEtat("erreur");
    }
  };

  return (
    <form className="formulaire" onSubmit={envoyer} noValidate>
      <Champ
        nom="nom"
        etiquette="Nom"
        valeurs={valeurs}
        erreurs={erreurs}
        onChange={modifier}
        autoComplete="name"
        placeholder="Prénom et nom"
        required
      />
      <Champ
        nom="email"
        etiquette="E-mail"
        type="email"
        valeurs={valeurs}
        erreurs={erreurs}
        onChange={modifier}
        autoComplete="email"
        placeholder="vous@exemple.fr"
        inputMode="email"
        required
      />
      <Champ
        nom="telephone"
        etiquette="Téléphone"
        type="tel"
        valeurs={valeurs}
        erreurs={erreurs}
        onChange={modifier}
        autoComplete="tel"
        placeholder="06 00 00 00 00"
        inputMode="tel"
      />
      <Champ
        nom="message"
        etiquette="Message"
        type="textarea"
        valeurs={valeurs}
        erreurs={erreurs}
        onChange={modifier}
        rows={5}
        placeholder="Modèle, année, kilométrage, et ce que vous constatez."
        required
      />

      <button className="bouton" type="submit" disabled={etat === "envoi"}>
        {etat === "envoi" ? "Envoi…" : "Envoyer la demande"}
      </button>

      <p aria-live="polite" role="status">
        {etat === "succes" ? (
          <span className="formulaire__retour formulaire__retour--succes">
            Demande reçue. Nous revenons vers vous sous 24 heures ouvrées.
          </span>
        ) : null}
        {etat === "erreur" ? (
          <span className="formulaire__retour">
            L&rsquo;envoi n&rsquo;a pas abouti. Appelez-nous au{" "}
            {contact.telephone}, nous prenons le relais.
          </span>
        ) : null}
        {etat === "invalide" ? (
          <span className="formulaire__retour">
            Quelques champs demandent une correction.
          </span>
        ) : null}
      </p>
    </form>
  );
}

export default function Contact() {
  const [ref, visible] = useReveal({ seuil: 0.12 });
  const etat = visible ? " reveal--visible" : "";

  return (
    <section id="contact" ref={ref} className="contact section">
      <div className="enveloppe">
        <header className="contact__entete">
          <span className="label">Le bureau</span>
          <h2 className={`reveal${etat}`}>Prendre rendez-vous</h2>
          <p className={`contact__chapeau reveal${etat} reveal--retard`}>
            Décrivez-nous la voiture et le symptôme. Nous vous rappelons pour
            fixer un créneau, et nous vous disons franchement si le sujet
            relève de notre atelier ou non.
          </p>
        </header>

        <div className="contact__grille">
          <Formulaire />

          <div className="coordonnees">
            <div className="bloc-info">
              <span className="label">Adresse</span>
              <address>
                {contact.adresse.ligne1}
                <br />
                {contact.adresse.codePostal} {contact.adresse.ville}
                <br />
                {contact.adresse.pays}
              </address>
            </div>

            <div className="bloc-info">
              <span className="label">Contact direct</span>
              <div>
                <a className="bloc-info__lien" href={`tel:${contact.telephoneLien}`}>
                  {contact.telephone}
                </a>
              </div>
              <div>
                <a className="bloc-info__lien" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </div>
            </div>

            <div className="bloc-info">
              <span className="label">Horaires</span>
              <table className="horaires">
                <caption className="lien-invisible">
                  Horaires d&rsquo;ouverture de l&rsquo;atelier
                </caption>
                <tbody>
                  {horaires.map((ligne) => (
                    <tr key={ligne.jour}>
                      <th scope="row">{ligne.jour}</th>
                      <td data-ferme={ligne.ferme ? "true" : "false"}>
                        {ligne.plage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bloc-info">
              <span className="label">Accès</span>
              <Plan />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
