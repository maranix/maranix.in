import { createEffect, createMemo, createSignal, For, onSettled } from "solid-js";
import type { PhotoItem } from "../data/photos";

interface DynamicGridProps {
  bucketKey: string;
  photos: PhotoItem[];
  onOpenLightbox: (photo: PhotoItem) => void;
}

const MIN_TILE_WIDTH = 190;

function animateTile(el: HTMLButtonElement, idx: number) {
  el.style.opacity = "0";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.animate(
        [
          { opacity: 0, transform: "translateY(22px) scale(0.92)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        {
          duration: 460,
          delay: Math.min(idx, 8) * 55,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        },
      );
      el.style.opacity = "";
    });
  });
}

export function DynamicGrid(props: DynamicGridProps) {
  let containerRef: HTMLDivElement | undefined;
  const [containerWidth, setContainerWidth] = createSignal(960);

  onSettled(() => {
    if (!containerRef) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(containerRef);
    return () => ro.disconnect();
  });

  createEffect(
    () => props.bucketKey,
    () => {
      if (containerRef) {
        containerRef.scrollTo({ top: 0, behavior: "instant" });
      }
    },
  );

  const columnCount = createMemo(() => {
    const count = props.photos.length;
    const maxColsByWidth = Math.max(1, Math.floor(containerWidth() / MIN_TILE_WIDTH));

    if (count <= 1) return 1;
    if (count === 2) return Math.min(2, maxColsByWidth);
    if (count <= 4) return Math.min(2, maxColsByWidth);
    if (count <= 9) return Math.min(3, maxColsByWidth);
    return Math.min(5, maxColsByWidth);
  });

  return (
    <div
      ref={(el) => {
        containerRef = el;
      }}
      class={props.photos.length === 1 ? "dynamic-container is-single" : "dynamic-container"}
    >
      <For each={[props.bucketKey]}>
        {() => (
          <div
            class="dynamic-grid"
            style={{
              "--grid-cols": String(columnCount()),
            }}
          >
            <For each={props.photos}>
              {(photo, idx) => (
                <button
                  ref={(el) => animateTile(el, idx())}
                  type="button"
                  class="photo-tile"
                  style={
                    props.photos.length > 1
                      ? { "aspect-ratio": String(photo.aspectRatio) }
                      : undefined
                  }
                  aria-label={`Open photo from ${photo.capturedAt}`}
                  onClick={() => props.onOpenLightbox(photo)}
                >
                  <img
                    src={photo.src}
                    alt={`Captured in ${photo.location} (${photo.capturedAt})`}
                    decoding="sync"
                  />
                </button>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
