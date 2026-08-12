/**
 * Identifiant public de l'opérateur, donnée de démonstration reprise du
 * README (« @m_vaudreuil »). À remplacer par le vrai handle avant mise en
 * ligne — seul identifiant montré au client, jamais nom ni téléphone.
 */
export const HANDLE_OPERATEUR = "@m_vaudreuil";

/** Zone approximative affichée sur l'écran de rendez-vous — jamais le point exact. */
export const ZONE_APPROXIMATIVE = "11E ARR.";

/** Seuil de vérification d'identité, en euros (règle métier n°5 du README). */
export const SEUIL_VERIFICATION_ID = 500;

/** Durée de blocage d'une variante à l'ajout au panier, en heures (règle n°3). */
export const DUREE_RESERVATION_HEURES = 12;

/**
 * Délai maximal accordé à l'opérateur pour traiter une vérification
 * d'identité, en heures. Passé ce délai sans validation ni refus, la
 * réservation est libérée et la photo supprimée : sans cette limite, une
 * commande oubliée retiendrait la pièce indéfiniment et conserverait la
 * pièce d'identité sans terme, contrairement à l'engagement de
 * conservation limitée. Valeur de configuration, à ajuster selon la
 * réactivité réelle de l'opérateur.
 */
export const DELAI_TRAITEMENT_VERIFICATION_HEURES = 48;

/** Frais de remise, en euros (règle métier n°4). */
export const FRAIS_REMISE = {
  point_neutre: 0,
  casier: 8,
  relais: 5,
  coursier: 22,
};

export const MODES_REMISE = [
  {
    cle: "point_neutre",
    titre: "RDV point neutre",
    description: "Lieu public convenu dans le fil chiffré.",
  },
  {
    cle: "casier",
    titre: "Casier / consigne",
    description: "Code à usage unique, 24 h de retrait.",
  },
  {
    cle: "relais",
    titre: "Point relais anonyme",
    description: "Retrait sur pseudonyme, sans pièce d'identité.",
  },
  {
    cle: "coursier",
    titre: "Coursier de confiance",
    description: "Encaisse les espèces à votre place.",
  },
];

export function libelleModeRemise(cle) {
  return MODES_REMISE.find((m) => m.cle === cle) ?? null;
}

/** Coupures EUR disponibles, du plus grand au plus petit, pour l'affichage du montant à apporter. */
export const COUPURES_EUR = [500, 200, 100, 50, 20, 10, 5, 2, 1];

export function repartirEnCoupures(montant) {
  let reste = Math.round(montant);
  const repartition = [];
  for (const coupure of COUPURES_EUR) {
    const nombre = Math.floor(reste / coupure);
    if (nombre > 0) {
      repartition.push({ coupure, nombre });
      reste -= nombre * coupure;
    }
  }
  return repartition;
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** Trois créneaux plausibles à partir de maintenant — donnée d'affichage, pas de vrai agenda. */
export function genererCreneaux(maintenant = new Date()) {
  const plagesJour = [
    { debut: 12, fin: 13 },
    { debut: 18, fin: 19 },
    { debut: 19, fin: 20 },
  ];
  const creneaux = [];
  let jour = new Date(maintenant);
  let indexPlage = plagesJour.findIndex((p) => p.debut > maintenant.getHours());
  if (indexPlage === -1) {
    jour.setDate(jour.getDate() + 1);
    indexPlage = 0;
  }

  while (creneaux.length < 3) {
    const plage = plagesJour[indexPlage];
    const estAujourdhui = jour.toDateString() === maintenant.toDateString();
    const estDemain = jour.toDateString() === new Date(maintenant.getTime() + 86_400_000).toDateString();
    const libelleJour = estAujourdhui ? "Aujourd'hui" : estDemain ? "Demain" : JOURS[jour.getDay()];
    creneaux.push(`${libelleJour} ${plage.debut}h–${plage.fin}h`);
    indexPlage += 1;
    if (indexPlage >= plagesJour.length) {
      indexPlage = 0;
      jour = new Date(jour.getTime() + 86_400_000);
    }
  }
  return creneaux;
}

const CARACTERES_CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I, ambiguïté à l'oral

export function genererCodeRemise() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CARACTERES_CODE[Math.floor(Math.random() * CARACTERES_CODE.length)];
  }
  return code;
}
