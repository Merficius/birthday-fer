import confetti from 'canvas-confetti';

/**
 * Animated calculation stages without subtexts:
 * 1. "calibrando frecuencias y melodías..."
 * 2. "🤖 bip bop calculando compatibilidad..."
 * 3. "...ya casi..."
 * 4. "tu amorcito te ama más ❤️"
 */
export async function runCalculatingAnimation({ onStageChange, onProgressUpdate }) {
  const stages = [
    {
      text: 'calibrando frecuencias y melodías...',
      duration: 3800,
      targetProgress: 25,
    },
    {
      text: '🤖 bip bop calculando compatibilidad...',
      duration: 4200,
      targetProgress: 60,
    },
    {
      text: '...ya casi...',
      duration: 3800,
      targetProgress: 88,
    },
    {
      text: 'tu amorcito te ama más ❤️',
      duration: 4500,
      targetProgress: 100,
    },
  ];

  let currentProgress = 0;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    onStageChange({
      stageIndex: i,
      totalStages: stages.length,
      text: stage.text,
    });

    const startProgress = currentProgress;
    const endProgress = stage.targetProgress;
    const startTime = performance.now();

    await new Promise((resolve) => {
      function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / stage.duration);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        currentProgress = startProgress + (endProgress - startProgress) * ease;
        onProgressUpdate(Math.round(currentProgress));

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  await new Promise((r) => setTimeout(r, 500));
}

/**
 * Celebratory confetti - set zIndex to 99999 so it renders IN FRONT of all modals
 */
export function fireCelebrationConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.6 },
    zIndex: 99999, // Always render in front of the modal!
    colors: ['#2563eb', '#dc2626', '#f59e0b', '#10b981', '#0284c7'],
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 35,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 65,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.9,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 30,
    decay: 0.92,
  });
}

/**
 * Easter Egg: Virtual kiss - with zIndex 99999
 */
export function fireHeartKiss() {
  const scalar = 2.2;
  const heart = confetti.shapeFromPath({
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  });

  confetti({
    shapes: [heart],
    scalar,
    zIndex: 99999, // Render in front of modal!
    particleCount: 50,
    spread: 90,
    origin: { y: 0.65 },
    colors: ['#dc2626', '#f43f5e', '#fb7185', '#f59e0b'],
  });
}
