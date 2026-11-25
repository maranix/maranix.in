import { For } from "solid-js";

export interface WheelOption<T extends string | number> {
  value: T;
  label: string;
}

interface WaterWheelProps<T extends string | number> {
  orientation: "vertical" | "horizontal";
  options: WheelOption<T>[];
  activeValue: T;
  onSelect: (value: T) => void;
  ariaLabel: string;
}

const ITEM_HEIGHT = 40;
const ITEM_WIDTH = 68;

export function WaterWheel<T extends string | number>(props: WaterWheelProps<T>) {
  let wheelAccum = 0;
  let lastStepAt = 0;

  const activeIndex = () => {
    const idx = props.options.findIndex((o) => o.value === props.activeValue);
    return idx === -1 ? 0 : idx;
  };

  const stepBy = (delta: number) => {
    const nextIdx = Math.max(0, Math.min(props.options.length - 1, activeIndex() + delta));
    const next = props.options[nextIdx];
    if (next && next.value !== props.activeValue) {
      props.onSelect(next.value);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastStepAt < 90) return;

    const rawDelta =
      props.orientation === "vertical"
        ? e.deltaY
        : Math.abs(e.deltaX) > Math.abs(e.deltaY)
          ? e.deltaX
          : e.deltaY;

    wheelAccum += rawDelta;
    if (Math.abs(wheelAccum) >= 32) {
      stepBy(wheelAccum > 0 ? 1 : -1);
      wheelAccum = 0;
      lastStepAt = now;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (props.orientation === "vertical") {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        stepBy(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        stepBy(1);
      }
    } else {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepBy(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepBy(1);
      }
    }
  };

  const trackTransform = () => {
    const idx = activeIndex();
    if (props.orientation === "vertical") {
      const offset = idx * ITEM_HEIGHT + ITEM_HEIGHT / 2;
      return `translate3d(0, -${offset}px, 0)`;
    }
    const offset = idx * ITEM_WIDTH + ITEM_WIDTH / 2;
    return `translate3d(-${offset}px, 0, 0)`;
  };

  const itemStyle = (idx: number) => {
    const dist = Math.abs(idx - activeIndex());
    if (dist === 0) return { "--wheel-scale": "1.2", "--wheel-opacity": "1" };
    if (dist === 1) return { "--wheel-scale": "0.95", "--wheel-opacity": "0.6" };
    if (dist === 2) return { "--wheel-scale": "0.86", "--wheel-opacity": "0.36" };
    return { "--wheel-scale": "0.8", "--wheel-opacity": "0.22" };
  };

  return (
    <nav
      class={`water-wheel water-wheel--${props.orientation}`}
      aria-label={props.ariaLabel}
      tabindex={0}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
    >
      <div class="water-wheel__track" style={{ transform: trackTransform() }}>
        <For each={props.options}>
          {(option, idx) => (
            <button
              type="button"
              class={
                option.value === props.activeValue
                  ? "water-wheel__item is-active"
                  : "water-wheel__item"
              }
              style={itemStyle(idx())}
              aria-current={option.value === props.activeValue ? "true" : undefined}
              onClick={() => props.onSelect(option.value)}
            >
              {option.label}
            </button>
          )}
        </For>
      </div>
    </nav>
  );
}
