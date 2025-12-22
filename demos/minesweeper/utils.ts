import confetti, { type Options } from 'canvas-confetti';

export function formatNumber(num: number) {
  return Math.min(999, Math.floor(num)).toString().padStart(3, '0');
}

export function isTouchDevice() {
  return window.matchMedia('(hover: none)').matches;
}

export function playWinConfetti(delay = 300) {
  const defaults = {
    particleCount: 50,
    origin: { y: 0.8 },
    gravity: 0.75,
    ticks: 600,
  } satisfies Options;

  const configs = [
    { spread: 26, startVelocity: 25 },
    { spread: 60, startVelocity: 30, decay: 0.95 },
    { spread: 100, startVelocity: 35, decay: 0.95, scalar: 0.9 },
    { spread: 120, startVelocity: 25, decay: 0.95, scalar: 1.2 },
    { spread: 120, startVelocity: 35, decay: 0.94 },
  ] satisfies Options[];

  setTimeout(() => {
    configs.forEach(config => {
      confetti({
        ...defaults,
        ...config,
      });
    });
  }, delay);
}
