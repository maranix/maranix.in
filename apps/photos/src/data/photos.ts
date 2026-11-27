import photosData from "./photos.json";

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

type RawPhoto = Omit<PhotoItem, "year" | "month">;
type GroupedPhotos = Record<string, Record<string, RawPhoto[]>>;

const grouped = photosData.photos as GroupedPhotos;

function withTransform(src: string, tr: string): string {
  if (!src.startsWith("http")) return src;
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}tr=${tr}`;
}

export function getPreviewUrl(src: string, width = 480): string {
  const quality = width > 480 ? 80 : 75;
  return withTransform(src, `f-auto,w-${width},q-${quality}`);
}

export function getFullUrl(src: string): string {
  return withTransform(src, "f-auto");
}

export function getYearsWithPhotos(): number[] {
  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);
}

export function getMonthsForYear(year: number): number[] {
  const months = grouped[String(year)];
  if (!months) return [];
  return Object.keys(months)
    .map(Number)
    .sort((a, b) => a - b);
}

export function getPhotosForBucket(year: number, month: number): PhotoItem[] {
  const items = grouped[String(year)]?.[String(month)] ?? [];
  return items.map((item) => ({
    ...item,
    year,
    month,
  }));
}

export function findPhotoById(id: string): PhotoItem | null {
  for (const [yearKey, months] of Object.entries(grouped)) {
    for (const [monthKey, items] of Object.entries(months)) {
      const match = items.find((item) => item.id === id);
      if (match) {
        return {
          ...match,
          year: Number(yearKey),
          month: Number(monthKey),
        };
      }
    }
  }
  return null;
}
