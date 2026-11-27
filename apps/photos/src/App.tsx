import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { DynamicGrid } from "./components/DynamicGrid";
import { Lightbox } from "./components/Lightbox";
import { WaterWheel } from "./components/WaterWheel";
import {
  findPhotoById,
  getMonthsForYear,
  getPhotosForBucket,
  getYearsWithPhotos,
  MONTH_NAMES,
  type PhotoItem,
} from "./data/photos";

type ThemeId = "darkroom" | "paper";

const STORAGE_KEY = "maranix-photos-theme";

function getInitialTheme(): ThemeId {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "paper" || saved === "darkroom") return saved;
  } catch {
    // ignore storage errors
  }
  return "darkroom";
}

function parseUrlState(years: number[]) {
  const currentYear = new Date().getFullYear();
  const fallbackYear = years.includes(currentYear) ? currentYear : years[years.length - 1];
  const params = new URLSearchParams(window.location.search);

  const photoParam = params.get("photo");
  if (photoParam) {
    const matched = findPhotoById(photoParam);
    if (matched) {
      return { year: matched.year, month: matched.month, photoId: matched.id };
    }
  }

  const yearParam = Number(params.get("year"));
  const year = years.includes(yearParam) ? yearParam : fallbackYear;
  const months = getMonthsForYear(year);
  const monthParam = Number(params.get("month")) - 1;
  const month = months.includes(monthParam) ? monthParam : months[months.length - 1];

  return { year, month, photoId: null as string | null };
}

function buildUrl(year: number, month: number, photoId: string | null): string {
  const params = new URLSearchParams();
  params.set("year", String(year));
  params.set("month", String(month + 1));
  if (photoId) params.set("photo", photoId);
  return `${window.location.pathname}?${params.toString()}`;
}

export function App() {
  // Ordered oldest -> newest so the active/latest year sits at center and earlier years extend upward
  const years = [...getYearsWithPhotos()].sort((a, b) => a - b);
  const initial = parseUrlState(years);

  const [selectedYear, setSelectedYear] = createSignal(initial.year);
  const [selectedMonth, setSelectedMonth] = createSignal(initial.month);
  const [theme, setTheme] = createSignal<ThemeId>(getInitialTheme());
  const [lightboxPhotoId, setLightboxPhotoId] = createSignal<string | null>(initial.photoId);

  createEffect(
    () => [selectedYear(), selectedMonth(), lightboxPhotoId()] as const,
    ([year, month, photoId], prev) => {
      const nextUrl = buildUrl(year, month, photoId);
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (nextUrl === currentUrl) return;

      const lightboxToggled = prev && Boolean(prev[2]) !== Boolean(photoId);
      if (lightboxToggled) {
        window.history.pushState(null, "", nextUrl);
      } else {
        window.history.replaceState(null, "", nextUrl);
      }
    },
  );

  const handlePopState = () => {
    const next = parseUrlState(years);
    setSelectedYear(next.year);
    setSelectedMonth(next.month);
    setLightboxPhotoId(next.photoId);
  };
  window.addEventListener("popstate", handlePopState);
  onCleanup(() => window.removeEventListener("popstate", handlePopState));

  const selectTheme = (next: ThemeId) => {
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  const availableMonths = createMemo(() => getMonthsForYear(selectedYear()));
  const activePhotos = createMemo(() => getPhotosForBucket(selectedYear(), selectedMonth()));

  const yearOptions = years.map((y) => ({ value: y, label: String(y) }));
  const monthOptions = createMemo(() =>
    availableMonths().map((m) => ({ value: m, label: MONTH_NAMES[m] })),
  );

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    const months = getMonthsForYear(year);
    if (!months.includes(selectedMonth())) {
      setSelectedMonth(months[months.length - 1]);
    }
  };

  const lightboxIndex = createMemo(() => {
    const id = lightboxPhotoId();
    if (!id) return -1;
    return activePhotos().findIndex((p) => p.id === id);
  });

  const lightboxPhoto = createMemo<PhotoItem | null>(() => {
    const idx = lightboxIndex();
    return idx >= 0 ? activePhotos()[idx] : null;
  });

  return (
    <div class="gallery-shell" data-theme={theme()}>
      <WaterWheel
        orientation="vertical"
        options={yearOptions}
        activeValue={selectedYear()}
        onSelect={handleSelectYear}
        ariaLabel="Years"
      />

      <main class="gallery-stage">
        <div class="theme-switcher" role="group" aria-label="Color theme">
          <button
            type="button"
            class={theme() === "darkroom" ? "is-active" : undefined}
            onClick={() => selectTheme("darkroom")}
          >
            Darkroom
          </button>
          <button
            type="button"
            class={theme() === "paper" ? "is-active" : undefined}
            onClick={() => selectTheme("paper")}
          >
            Paper
          </button>
        </div>

        <DynamicGrid
          bucketKey={`${selectedYear()}-${selectedMonth()}`}
          photos={activePhotos()}
          onOpenLightbox={(photo) => setLightboxPhotoId(photo.id)}
        />
      </main>

      <div class="gallery-corner">© maranix</div>

      <WaterWheel
        orientation="horizontal"
        options={monthOptions()}
        activeValue={selectedMonth()}
        onSelect={setSelectedMonth}
        ariaLabel="Months"
      />

      <Lightbox
        photo={lightboxPhoto()}
        previewWidth={activePhotos().length === 1 ? 960 : 480}
        hasPrev={lightboxIndex() > 0}
        hasNext={lightboxIndex() >= 0 && lightboxIndex() < activePhotos().length - 1}
        onClose={() => setLightboxPhotoId(null)}
        onPrev={() => {
          const idx = lightboxIndex();
          if (idx > 0) setLightboxPhotoId(activePhotos()[idx - 1].id);
        }}
        onNext={() => {
          const idx = lightboxIndex();
          if (idx >= 0 && idx < activePhotos().length - 1) {
            setLightboxPhotoId(activePhotos()[idx + 1].id);
          }
        }}
      />
    </div>
  );
}
