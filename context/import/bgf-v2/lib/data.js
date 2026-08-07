/**
 * Contenu éditorial du site BGF.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * COORDONNÉES ET HORAIRES : VALEURS FICTIVES.
 * BGF est une marque de démonstration. L'adresse, le téléphone et l'e-mail
 * ci-dessous sont inventés et cohérents avec Lyon. Le numéro appartient à la
 * plage 0X 99 00 XX XX réservée par l'ARCEP à la fiction : il ne sonne chez
 * personne. Remplace ce seul bloc `contact` par les vraies coordonnées, rien
 * d'autre dans le projet ne les duplique.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const contact = {
  raisonSociale: "BGF",
  baseline: "Garage d'exception — Lyon",
  adresse: {
    ligne1: "18 rue de Gerland",
    codePostal: "69007",
    ville: "Lyon",
    pays: "France",
  },
  telephone: "04 99 00 12 34",
  telephoneLien: "+33499001234",
  email: "contact@bgf-garage.fr",
  // Coordonnées géographiques du quartier de Gerland, utilisées uniquement
  // pour orienter le plan vectoriel dessiné en SVG et le lien cartographique.
  geo: { lat: 45.7325, lon: 4.8305 },
};

export const horaires = [
  { jour: "Lundi — Jeudi", plage: "8h00 — 19h00" },
  { jour: "Vendredi", plage: "8h00 — 18h00" },
  { jour: "Samedi", plage: "9h00 — 13h00, sur rendez-vous" },
  { jour: "Dimanche", plage: "Fermé", ferme: true },
];

/**
 * Les cinq services.
 *
 * `visuel` désigne la géométrie procédurale de repli, construite dans
 * components/three/VisuelService.jsx — aucun fichier externe.
 * `alt` décrit l'image photographique attendue en `public/services/<id>.webp`,
 * et sert de texte alternatif dès que cette image existe. Voir
 * lib/visuelsDisponibles.js : tant que le fichier manque, c'est le visuel
 * procédural qui s'affiche.
 */
export const services = [
  {
    numero: "01",
    id: "entretien",
    titre: "Entretien",
    accroche: "La rigueur avant la panne.",
    texte:
      "Vidange, filtration, freinage, distribution : chaque intervention suit le carnet du constructeur et se termine par un contrôle sur pont. Nous documentons ce que nous touchons, et nous vous montrons les pièces déposées. Un entretien tenu, c'est une voiture qui ne vous surprend jamais.",
    visuel: "disque",
    alt: "Disque de frein ventilé démonté sur l'établi de l'atelier BGF, sous rampe de néons.",
  },
  {
    numero: "02",
    id: "reparation",
    titre: "Réparation",
    accroche: "Ce qui casse, nous le comprenons.",
    texte:
      "Moteur, boîte, embrayage, trains roulants, circuits électriques. Nous remontons à la cause plutôt que de remplacer par précaution, et nous vous donnons le coût réel avant de démonter. Aucune pièce n'est commandée sans votre accord.",
    visuel: "ecrou",
    alt: "Moteur déposé sur banc dans l'atelier BGF, éclairé par les néons froids du plafond.",
  },
  {
    numero: "03",
    id: "diagnostic",
    titre: "Diagnostic",
    accroche: "Lire la voiture avant de l'ouvrir.",
    texte:
      "Valise multimarque, lecture des trames, mesures sous charge et essai routier instrumenté. Un défaut intermittent se traque sur la route, pas seulement à l'arrêt. Vous repartez avec un relevé clair : ce qui est en cause, ce qui ne l'est pas.",
    visuel: "onde",
    alt: "Poste de diagnostic embarqué dans l'habitacle, valise et courbes de mesure à l'écran.",
  },
  {
    numero: "04",
    id: "carrosserie",
    titre: "Carrosserie",
    accroche: "La ligne d'origine, retrouvée.",
    texte:
      "Redressage, remplacement d'éléments, raccords de teinte au spectrophotomètre et cabine à température maîtrisée. Le vernis est poli à la machine jusqu'à ce que le reflet redevienne net. Sur les teintes nacrées, nous travaillons en trois couches comme en usine.",
    visuel: "aile",
    alt: "Véhicule masqué en cabine de peinture BGF, pistolet et éclairage de contrôle.",
  },
  {
    numero: "05",
    id: "preparation",
    titre: "Préparation esthétique",
    accroche: "Le détail qui change tout.",
    texte:
      "Décontamination, correction du vernis en deux passes, protection céramique et remise en état des cuirs et plastiques. Le résultat se juge sous néon, à quinze centimètres. C'est la finition que nous appliquons à nos propres voitures.",
    visuel: "goutte",
    alt: "Carrosserie fraîchement polie sous néon, reflet net sur le vernis.",
  },
];

export const navigation = [
  { href: "#services", label: "Services" },
  { href: "#contact", label: "Contact" },
];
