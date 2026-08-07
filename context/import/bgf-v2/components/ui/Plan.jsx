import { contact } from "@/lib/data";

/**
 * Plan d'accès dessiné en SVG, tracé par tracé.
 *
 * Aucune tuile cartographique n'est chargée : le site n'a le droit à aucun
 * fichier externe. C'est donc un plan schématique — voirie, fleuve, voie
 * ferrée, îlots — surmonté d'un repère à l'adresse de l'atelier. Le lien
 * sous le plan renvoie vers une carte réelle pour l'itinéraire.
 */
export default function Plan() {
  const { geo, adresse } = contact;
  const lienCarte = `https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lon}#map=16/${geo.lat}/${geo.lon}`;

  const ilots = [
    [46, 44, 118, 74],
    [188, 40, 96, 78],
    [308, 46, 128, 72],
    [462, 38, 122, 80],
    [46, 156, 118, 92],
    [188, 158, 96, 90],
    [308, 160, 128, 88],
    [462, 154, 122, 94],
    [46, 288, 118, 70],
    [188, 286, 96, 72],
    [308, 290, 128, 68],
  ];

  return (
    <div className="plan">
      <svg
        viewBox="0 0 640 400"
        role="img"
        aria-label={`Plan schématique du quartier autour du ${adresse.ligne1}, ${adresse.codePostal} ${adresse.ville}`}
      >
        <rect x="0" y="0" width="640" height="400" fill="#08090b" />

        {/* Îlots bâtis */}
        {ilots.map(([x, y, l, h]) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={l}
            height={h}
            fill="#101216"
            stroke="#191d23"
            strokeWidth="1"
          />
        ))}

        {/* Voirie secondaire */}
        <g stroke="#1d2128" strokeWidth="8" strokeLinecap="square">
          <line x1="176" y1="20" x2="176" y2="380" />
          <line x1="296" y1="20" x2="296" y2="380" />
          <line x1="448" y1="20" x2="448" y2="380" />
          <line x1="20" y1="132" x2="620" y2="132" />
          <line x1="20" y1="272" x2="620" y2="272" />
        </g>

        {/* Avenue principale */}
        <line
          x1="0"
          y1="204"
          x2="640"
          y2="204"
          stroke="#2a2f38"
          strokeWidth="18"
        />
        <line
          x1="0"
          y1="204"
          x2="640"
          y2="204"
          stroke="#3a414d"
          strokeWidth="1"
          strokeDasharray="14 16"
        />

        {/* Fleuve */}
        <path
          d="M0 372 C 96 356, 172 392, 268 374 C 372 354, 452 390, 640 366 L640 400 L0 400 Z"
          fill="#0c141d"
        />
        <path
          d="M0 372 C 96 356, 172 392, 268 374 C 372 354, 452 390, 640 366"
          fill="none"
          stroke="#16222e"
          strokeWidth="2"
        />

        {/* Voie ferrée */}
        <line
          x1="20"
          y1="66"
          x2="620"
          y2="30"
          stroke="#191d23"
          strokeWidth="4"
        />
        <line
          x1="20"
          y1="66"
          x2="620"
          y2="30"
          stroke="#2c323b"
          strokeWidth="4"
          strokeDasharray="3 12"
        />

        {/* Repère de l'atelier */}
        <g transform="translate(296 204)">
          <circle r="34" fill="none" stroke="#d90429" strokeWidth="1" opacity="0.35" />
          <circle r="18" fill="none" stroke="#d90429" strokeWidth="1" opacity="0.6" />
          <line x1="-46" y1="0" x2="-24" y2="0" stroke="#d90429" strokeWidth="1" />
          <line x1="24" y1="0" x2="46" y2="0" stroke="#d90429" strokeWidth="1" />
          <line x1="0" y1="-46" x2="0" y2="-24" stroke="#d90429" strokeWidth="1" />
          <line x1="0" y1="24" x2="0" y2="46" stroke="#d90429" strokeWidth="1" />
          <circle r="6" fill="#d90429" />
          <text
            x="0"
            y="-60"
            textAnchor="middle"
            fill="#f5f5f5"
            fontSize="15"
            fontWeight="700"
            letterSpacing="4"
          >
            BGF
          </text>
        </g>

        {/* Rose des vents */}
        <g transform="translate(596 356)" opacity="0.6">
          <line x1="0" y1="14" x2="0" y2="-14" stroke="#6d7684" strokeWidth="1" />
          <path d="M0 -18 L4 -8 L-4 -8 Z" fill="#f5f5f5" />
          <text x="0" y="26" textAnchor="middle" fill="#6d7684" fontSize="10">
            N
          </text>
        </g>
      </svg>

      <div className="plan__legende">
        <span>Plan schématique — le repère marque l&rsquo;atelier</span>
        <a
          className="plan__lien"
          href={lienCarte}
          target="_blank"
          rel="noreferrer noopener"
        >
          Ouvrir la carte
        </a>
      </div>
    </div>
  );
}
