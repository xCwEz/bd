/**
 * Contenu éditorial du site Bourganeuf Automobiles.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * COORDONNÉES ET HORAIRES : VALEURS PROVISOIRES.
 * Le client n'a pas encore transmis ses vraies coordonnées. L'adresse ci-
 * dessous est plausible pour Bourganeuf (23400, Creuse) mais inventée, et le
 * numéro appartient à la plage 0X 99 00 XX XX réservée par l'ARCEP à la
 * fiction : il ne sonne chez personne. Remplace ce seul bloc `contact` par
 * les vraies coordonnées dès qu'elles arrivent, rien d'autre dans le projet
 * ne les duplique.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const contact = {
  raisonSociale: "Bourganeuf Automobiles",
  baseline: "Garage & concession — Creuse",
  adresse: {
    ligne1: "8 route de Guéret",
    codePostal: "23400",
    ville: "Bourganeuf",
    pays: "France",
  },
  telephone: "05 99 00 45 67",
  telephoneLien: "+33599004567",
  email: "contact@bourganeuf-automobiles.fr",
  // Coordonnées approximatives du centre de Bourganeuf, utilisées uniquement
  // pour orienter le plan vectoriel dessiné en SVG et le lien cartographique.
  // À ajuster dès que l'adresse réelle est connue.
  geo: { lat: 45.9575, lon: 1.7527 },
};

export const horaires = [
  { jour: "Lundi — Vendredi", plage: "8h30 — 12h00, 14h00 — 18h30" },
  { jour: "Samedi", plage: "9h00 — 12h00, sur rendez-vous" },
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
    alt: "Disque de frein ventilé démonté sur l'établi de l'atelier, sous rampe de néons.",
  },
  {
    numero: "02",
    id: "reparation",
    titre: "Réparation",
    accroche: "Ce qui casse, nous le comprenons.",
    texte:
      "Moteur, boîte, embrayage, trains roulants, circuits électriques. Nous remontons à la cause plutôt que de remplacer par précaution, et nous vous donnons le coût réel avant de démonter. Aucune pièce n'est commandée sans votre accord.",
    visuel: "ecrou",
    alt: "Moteur déposé sur banc dans l'atelier, éclairé par les néons froids du plafond.",
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
    alt: "Véhicule masqué en cabine de peinture, pistolet et éclairage de contrôle.",
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

/**
 * Le stock de véhicules à vendre (section Collection).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DONNÉES DE DÉMONSTRATION. Le client n'a pas encore transmis son stock réel
 * ni de photos. Les trois entrées ci-dessous existent pour que la section
 * soit démontrable ; à remplacer intégralement dès réception du vrai stock.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `photos` : chemins vers de vraies photos dans `public/vehicules/<id>/`.
 * C'est la seule exception à la règle « tout est procédural » du reste du
 * site — un acheteur a besoin de voir la vraie voiture. Tant que le tableau
 * est vide, la fiche affiche un repli procédural avec le nom du véhicule.
 */
export const vehicules = [
  {
    id: "exemple-1",
    marque: "Peugeot",
    modele: "308",
    annee: 2019,
    kilometrage: 68000,
    carburant: "Diesel",
    transmission: "Manuelle",
    prix: 12900,
    description:
      "Citadine familiale bien entretenue, carnet d'entretien complet, distribution refaite en 2024.",
    photos: [],
  },
  {
    id: "exemple-2",
    marque: "Renault",
    modele: "Clio V",
    annee: 2021,
    kilometrage: 32000,
    carburant: "Essence",
    transmission: "Manuelle",
    prix: 14500,
    description:
      "Première main, faible kilométrage, garantie constructeur encore active quelques mois.",
    photos: [],
  },
  {
    id: "exemple-3",
    marque: "Citroën",
    modele: "C3",
    annee: 2018,
    kilometrage: 81000,
    carburant: "Essence",
    transmission: "Manuelle",
    prix: 9900,
    description:
      "Petit budget, contrôle technique récent sans contre-visite, révisée avant mise en vente.",
    photos: [],
  },
];

export const navigation = [
  { href: "#services", label: "Services" },
  { href: "#collection", label: "Collection" },
  { href: "#contact", label: "Contact" },
];
