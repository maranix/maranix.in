import { onSettled, Show } from "solid-js";
import type { PhotoItem } from "../data/photos";

interface LightboxProps {
  photo: PhotoItem | null;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox(props: LightboxProps) {
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
            <img src={photo().src} alt={`${photo().location} — ${photo().capturedAt}`} />
            <figcaption class="lightbox__exif">
              <span>{photo().capturedAt}</span>
              <span class="lightbox__dot" aria-hidden="true">
                ·
              </span>
              <span>{photo().location}</span>
              <span class="lightbox__dot" aria-hidden="true">
                ·
              </span>
              <span>{photo().camera}</span>
              <span class="lightbox__dot" aria-hidden="true">
                ·
              </span>
              <span>{photo().lens}</span>
              <span class="lightbox__dot" aria-hidden="true">
                ·
              </span>
              <span>{photo().settings}</span>
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
