import { createEffect, createSignal, onCleanup, onSettled, Show } from "solid-js";
import { getFullUrl, getPreviewUrl, type PhotoItem } from "../data/photos";

interface LightboxProps {
  photo: PhotoItem | null;
  previewWidth?: number;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox(props: LightboxProps) {
  const [loadedFullId, setLoadedFullId] = createSignal<string | null>(null);

  createEffect(
    () => props.photo,
    (photo) => {
      setLoadedFullId(null);
      if (!photo) return;

      let cancelled = false;
      const fullUrl = getFullUrl(photo.src);
      const preloader = new Image();

      preloader.onload = () => {
        if (!cancelled) setLoadedFullId(photo.id);
      };
      preloader.src = fullUrl;

      onCleanup(() => {
        cancelled = true;
      });
    },
  );

  onSettled(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!props.photo) return;
      if (e.key === "Escape") props.onClose();
      if (e.key === "ArrowLeft" && props.hasPrev) props.onPrev();
      if (e.key === "ArrowRight" && props.hasNext) props.onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <Show when={props.photo}>
      {(photo) => (
        <div
          class="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo detail"
          onClick={(e) => {
            if (e.target === e.currentTarget) props.onClose();
          }}
        >
          <button
            type="button"
            class="lightbox__close"
            aria-label="Close lightbox"
            onClick={props.onClose}
          >
            ✕
          </button>

          <button
            type="button"
            class="lightbox__nav lightbox__nav--prev"
            disabled={!props.hasPrev}
            aria-label="Previous photo"
            onClick={props.onPrev}
          >
            ←
          </button>

          <figure class="lightbox__stage">
            <img
              src={
                loadedFullId() === photo().id
                  ? getFullUrl(photo().src)
                  : getPreviewUrl(photo().src, props.previewWidth)
              }
              alt={
                photo().location
                  ? `${photo().location} — ${photo().capturedAt}`
                  : `Photo from ${photo().capturedAt}`
              }
            />
            <figcaption class="lightbox__exif">
              <span>{photo().capturedAt}</span>
              <Show when={photo().location}>
                <span class="lightbox__dot" aria-hidden="true">
                  ·
                </span>
                <span>{photo().location}</span>
              </Show>
              <span class="lightbox__dot" aria-hidden="true">
                ·
              </span>
              <span>{photo().camera}</span>
              <Show when={photo().lens}>
                <span class="lightbox__dot" aria-hidden="true">
                  ·
                </span>
                <span>{photo().lens}</span>
              </Show>
              <Show when={photo().settings}>
                <span class="lightbox__dot" aria-hidden="true">
                  ·
                </span>
                <span>{photo().settings}</span>
              </Show>
            </figcaption>
          </figure>

          <button
            type="button"
            class="lightbox__nav lightbox__nav--next"
            disabled={!props.hasNext}
            aria-label="Next photo"
            onClick={props.onNext}
          >
            →
          </button>
        </div>
      )}
    </Show>
  );
}
