import { SONGS, QUESTIONS, createInitialRatings } from './data.js';

const STORAGE_KEY = 'birthday_amorcito_ratings_v4';
const HAS_EXPORTED_KEY = 'birthday_amorcito_has_exported_v4';
const USERNAME_KEY = 'birthday_amorcito_username_v4';

export function loadSavedRatings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialRatings();
    const parsed = JSON.parse(raw);

    const initial = createInitialRatings();
    SONGS.forEach((song) => {
      if (parsed[song.id]) {
        QUESTIONS.forEach((q) => {
          if (typeof parsed[song.id][q.id] === 'number') {
            initial[song.id][q.id] = parsed[song.id][q.id];
          }
        });
      }
    });
    return initial;
  } catch (err) {
    console.warn('Error reading from localStorage, using initial ratings:', err);
    return createInitialRatings();
  }
}

export function saveRatingsToStorage(ratings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  } catch (err) {
    console.error('Failed to save ratings:', err);
  }
}

export function getSavedUsername() {
  return localStorage.getItem(USERNAME_KEY) || 'Mi Amorcito';
}

export function setSavedUsername(name) {
  localStorage.setItem(USERNAME_KEY, name || 'Mi Amorcito');
}

export function getHasExported() {
  return localStorage.getItem(HAS_EXPORTED_KEY) === 'true';
}

export function markAsExported() {
  localStorage.setItem(HAS_EXPORTED_KEY, 'true');
}

export function buildExportPayload(ratings, userName) {
  const songList = SONGS.map((song) => {
    const songRatings = {};
    QUESTIONS.forEach((q) => {
      songRatings[q.id] = ratings[song.id]?.[q.id] ?? 5.0;
    });
    return {
      id: song.id,
      title: song.title,
      trackNumber: song.trackNumber,
      ratings: songRatings,
    };
  });

  return {
    app: 'Medidor de Compatibilidad Musical: Mi Amorcito & Su Amorcito',
    version: '4.0',
    exportedAt: new Date().toISOString(),
    userName: userName || 'Mi Amorcito',
    songs: songList,
  };
}

export function parseImportPayload(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.songs)) {
      throw new Error('El archivo no tiene el formato esperado (falta lista de canciones).');
    }

    const importedRatings = {};
    let matchedCount = 0;

    data.songs.forEach((item) => {
      if (item && item.id && item.ratings) {
        importedRatings[item.id] = {};
        QUESTIONS.forEach((q) => {
          if (typeof item.ratings[q.id] === 'number') {
            importedRatings[item.id][q.id] = Math.min(10, Math.max(0, parseFloat(item.ratings[q.id])));
          } else {
            importedRatings[item.id][q.id] = 5.0;
          }
        });
        matchedCount++;
      }
    });

    if (matchedCount === 0) {
      throw new Error('No se encontraron canciones válidas en el archivo importado.');
    }

    return {
      userName: data.userName || 'Su Amorcito',
      ratings: importedRatings,
      exportedAt: data.exportedAt,
    };
  } catch (err) {
    throw new Error('Archivo inválido: ' + err.message);
  }
}

export function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
