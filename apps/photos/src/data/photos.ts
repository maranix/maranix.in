export interface PhotoItem {
  id: string;
  year: number;
  month: number; // 0 = Jan, 11 = Dec
  src: string;
  aspectRatio: number; // width / height
  camera: string;
  lens: string;
  settings: string;
  location: string;
  capturedAt: string;
}

export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

interface Palette {
  bg1: string;
  bg2: string;
  accent: string;
  glow: string;
  variant: "horizon" | "rings" | "monolith" | "prism";
}

const PALETTES: Palette[] = [
  { bg1: "#1c2541", bg2: "#3a506b", accent: "#eb5e28", glow: "#f4a261", variant: "horizon" },
  { bg1: "#2b2d42", bg2: "#5c677d", accent: "#e07a5f", glow: "#f2cc8f", variant: "rings" },
  { bg1: "#283618", bg2: "#606c38", accent: "#dda15e", glow: "#fefae0", variant: "monolith" },
  { bg1: "#3d2c2e", bg2: "#6d4c3d", accent: "#f4a261", glow: "#e9c46a", variant: "prism" },
  { bg1: "#1b4332", bg2: "#2d6a4f", accent: "#d8f3dc", glow: "#95d5b2", variant: "horizon" },
  { bg1: "#22223b", bg2: "#4a4e69", accent: "#c9ada7", glow: "#f2e9e4", variant: "rings" },
  { bg1: "#370617", bg2: "#6a040f", accent: "#faa307", glow: "#ffba08", variant: "monolith" },
  { bg1: "#0f2027", bg2: "#2c5364", accent: "#e76f51", glow: "#f4a261", variant: "prism" },
];

/** Generates a crisp offline SVG artwork matching the photo's exact aspect ratio. */
function makeFrameSvg(seed: number, aspectRatio: number): string {
  const width = 900;
  const height = Math.round(width / aspectRatio);
  const p = PALETTES[seed % PALETTES.length];
  const shift = ((seed * 37) % 40) - 20;

  let motif = "";
  if (p.variant === "horizon") {
    const sunY = Math.round(height * (0.42 + (seed % 3) * 0.06));
    const sunX = Math.round(width * (0.5 + shift / 120));
    motif = `
      <circle cx="${sunX}" cy="${sunY}" r="${Math.round(Math.min(width, height) * 0.16)}" fill="${p.glow}" opacity="0.88" />
      <path d="M0 ${Math.round(height * 0.62)} Q ${Math.round(width * 0.35)} ${Math.round(height * 0.54)} ${width} ${Math.round(height * 0.65)} L ${width} ${height} L 0 ${height} Z" fill="${p.bg1}" opacity="0.72" />
      <path d="M0 ${Math.round(height * 0.74)} Q ${Math.round(width * 0.6)} ${Math.round(height * 0.68)} ${width} ${Math.round(height * 0.78)} L ${width} ${height} L 0 ${height} Z" fill="${p.accent}" opacity="0.28" />
    `;
  } else if (p.variant === "rings") {
    const cx = Math.round(width * 0.5 + shift * 3);
    const cy = Math.round(height * 0.48);
    const baseR = Math.round(Math.min(width, height) * 0.14);
    motif = `
      <circle cx="${cx}" cy="${cy}" r="${baseR * 2.1}" fill="none" stroke="${p.glow}" stroke-width="2" opacity="0.25" />
      <circle cx="${cx}" cy="${cy}" r="${baseR * 1.45}" fill="none" stroke="${p.accent}" stroke-width="3" opacity="0.55" />
      <circle cx="${cx}" cy="${cy}" r="${baseR * 0.8}" fill="${p.glow}" opacity="0.82" />
    `;
  } else if (p.variant === "monolith") {
    const bw = Math.round(width * 0.28);
    const bh = Math.round(height * 0.56);
    const bx = Math.round((width - bw) / 2 + shift * 2);
    const by = Math.round((height - bh) / 2);
    motif = `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${p.bg1}" opacity="0.78" />
      <circle cx="${bx + bw}" cy="${by}" r="${Math.round(bw * 0.45)}" fill="${p.accent}" opacity="0.75" />
    `;
  } else {
    motif = `
      <polygon points="${Math.round(width * 0.2)},${height} ${Math.round(width * 0.52 + shift * 2)},${Math.round(height * 0.2)} ${Math.round(width * 0.85)},${height}" fill="${p.glow}" opacity="0.32" />
      <polygon points="${Math.round(width * 0.35)},${height} ${Math.round(width * 0.62 - shift)},${Math.round(height * 0.36)} ${Math.round(width * 0.92)},${height}" fill="${p.accent}" opacity="0.45" />
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g${seed})"/>
    ${motif}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface BucketSeed {
  year: number;
  month: number;
  location: string;
  ratios: number[];
}

const BUCKET_SEEDS: BucketSeed[] = [
  { year: 2026, month: 10, location: "Bengaluru", ratios: [1.5, 0.75, 1.33, 0.8] },
  { year: 2026, month: 8, location: "Coorg", ratios: [1.77] },
  { year: 2026, month: 4, location: "Hampi", ratios: [1.5, 0.67, 1.0, 1.5, 0.8, 1.33, 1.5] },
  { year: 2026, month: 1, location: "Jaipur", ratios: [0.75, 1.5] },

  { year: 2025, month: 11, location: "Varkala", ratios: [1.5, 1.33, 0.75] },
  {
    year: 2025,
    month: 9,
    location: "Spiti Valley",
    ratios: [1.5, 0.67, 1.77, 1.0, 0.8, 1.5, 1.33, 0.75, 1.5, 0.67, 1.33, 1.0, 1.5, 0.8],
  },
  { year: 2025, month: 5, location: "Gokarna", ratios: [1.5, 0.8, 1.33, 1.5, 0.75] },
  { year: 2025, month: 2, location: "Mysuru", ratios: [1.33] },

  { year: 2024, month: 10, location: "Munnar", ratios: [0.75, 1.5, 1.0, 1.5] },
  {
    year: 2024,
    month: 6,
    location: "Udaipur",
    ratios: [1.5, 0.67, 1.33, 0.8, 1.5, 1.0, 1.77, 0.75],
  },
  { year: 2024, month: 0, location: "Kochi", ratios: [1.5, 1.33] },

  { year: 2023, month: 11, location: "Pondicherry", ratios: [0.8, 1.5, 0.75, 1.33, 1.0, 1.5] },
  { year: 2023, month: 7, location: "Ladakh", ratios: [1.77, 1.5, 0.67] },
  { year: 2023, month: 3, location: "Chennai", ratios: [1.0] },

  { year: 2022, month: 8, location: "Ooty", ratios: [1.5, 0.75, 1.33, 0.8, 1.5] },
  { year: 2022, month: 4, location: "Goa", ratios: [1.5, 0.67] },
];

const CAMERAS = ["Fujifilm X-T5", "Ricoh GR IIIx", "Sony A7C II"];
const LENSES = ["23mm f/1.4", "40mm f/2.8", "35mm f/1.8", "56mm f/1.2"];
const SETTINGS = [
  "f/2.0 · 1/500s · ISO 160",
  "f/5.6 · 1/250s · ISO 200",
  "f/1.8 · 1/125s · ISO 400",
  "f/4.0 · 1/1000s · ISO 100",
];

let idCounter = 1;

export const PHOTOS: PhotoItem[] = BUCKET_SEEDS.flatMap((bucket) =>
  bucket.ratios.map((aspectRatio, idx) => {
    const seed = idCounter++;
    const day = String(((idx * 3 + 2) % 27) + 1).padStart(2, "0");
    return {
      id: `${bucket.year}-${bucket.month}-${idx}`,
      year: bucket.year,
      month: bucket.month,
      src: makeFrameSvg(seed, aspectRatio),
      aspectRatio,
      camera: CAMERAS[seed % CAMERAS.length],
      lens: LENSES[seed % LENSES.length],
      settings: SETTINGS[seed % SETTINGS.length],
      location: bucket.location,
      capturedAt: `${MONTH_NAMES[bucket.month]} ${day}, ${bucket.year}`,
    };
  }),
);

export function getYearsWithPhotos(): number[] {
  const years = new Set(PHOTOS.map((p) => p.year));
  return Array.from(years).sort((a, b) => b - a);
}

export function getMonthsForYear(year: number): number[] {
  const months = new Set(PHOTOS.filter((p) => p.year === year).map((p) => p.month));
  return Array.from(months).sort((a, b) => a - b);
}

export function getPhotosForBucket(year: number, month: number): PhotoItem[] {
  return PHOTOS.filter((p) => p.year === year && p.month === month);
}
