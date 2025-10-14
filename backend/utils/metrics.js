let emaResponseMs = 0;
const ALPHA = 0.2; // exponential moving average weight

export function recordResponseMs(durationMs) {
  if (!Number.isFinite(durationMs)) return;
  if (emaResponseMs === 0) {
    emaResponseMs = durationMs;
  } else {
    emaResponseMs = ALPHA * durationMs + (1 - ALPHA) * emaResponseMs;
  }
}

export function getAverageResponseMs() {
  return Math.max(0, Math.round(emaResponseMs));
}


