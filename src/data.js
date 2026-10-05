export const SONGS = [
  {
    id: 'who-will-save-you-now',
    trackNumber: '01',
    title: 'Who Will Save You Now',
  },
  {
    id: 'we-were-only-young',
    trackNumber: '02',
    title: 'We Were Only Young',
  },
  {
    id: 'back-to-me',
    trackNumber: '03',
    title: 'Back to Me',
  },
  {
    id: 'without-you',
    trackNumber: '04',
    title: 'Without You',
  },
  {
    id: 'get-me-high',
    trackNumber: '05',
    title: 'Get Me High',
  },
  {
    id: 'all-ill-ever-need',
    trackNumber: '06',
    title: "All I'll Ever Need",
  },
  {
    id: 'vultures',
    trackNumber: '07',
    title: 'Vultures',
  },
  {
    id: 'last-forever',
    trackNumber: '08',
    title: 'Last Forever',
  },
  {
    id: 'learn-to-lose',
    trackNumber: '09',
    title: 'Learn to Lose',
  },
  {
    id: 'hindsight',
    trackNumber: '10',
    title: 'Hindsight',
  },
  {
    id: 'its-not-over',
    trackNumber: '11',
    title: "It's Not Over",
  },
  {
    id: 'the-one-for-me',
    trackNumber: '12',
    title: 'The One For Me',
  },
];

export const QUESTIONS = [
  {
    id: 'q1',
    text: '¿Qué tanto te gustó la música?',
    shortLabel: 'Música',
    icon: '🎵',
    description: 'Ritmo, instrumentos, melodía',
  },
  {
    id: 'q2',
    text: '¿Qué tanto te gustó la letra?',
    shortLabel: 'Letra',
    icon: '✍️',
    description: 'Letra, rimas y conexión emocional',
  },
  {
    id: 'q3',
    text: '¿Qué tanto te hace pensar en tu amorcito?',
    shortLabel: 'Pensar en ti',
    icon: '💭❤️',
    description: 'Nivel de complicidad y recuerdos de tu amorcito',
  },
  {
    id: 'q4',
    text: '¿Qué calificación general le das?',
    shortLabel: 'Calificación General',
    icon: '⭐',
    description: 'Tu veredicto total para esta canción',
  },
  {
    id: 'q5',
    text: '¿Qué calificación crees que el otro le dió?',
    shortLabel: 'Predicción del otro',
    icon: '🔮',
    description: '¿Qué tan bien conoces el gusto musical de tu amorcito?',
  },
];

export const DEFAULT_RATING = 5.0;

export function createInitialRatings() {
  const initial = {};
  SONGS.forEach((song) => {
    initial[song.id] = {};
    QUESTIONS.forEach((q) => {
      initial[song.id][q.id] = DEFAULT_RATING;
    });
  });
  return initial;
}
