import assert from 'node:assert';
import { SONGS, QUESTIONS, createInitialRatings } from '../src/data.js';
import { calculateItemScore, compareData } from '../src/compatibility.js';
import { buildExportPayload, parseImportPayload } from '../src/storage.js';

console.log('--- Corriendo pruebas de validación automatizada ---');

// Test 1: Verificar 12 canciones
assert.strictEqual(SONGS.length, 12, 'Debe haber exactamente 12 canciones');
const theOne = SONGS.find(s => s.title === 'The One For Me');
assert.ok(theOne, 'Debe incluir "The One For Me"');
const whoWill = SONGS.find(s => s.title === 'Who Will Save You Now');
assert.ok(whoWill, 'Debe incluir "Who Will Save You Now"');
console.log('✔ Canciones verificadas (12 canciones, incluyendo The One For Me y Who Will Save You Now)');

// Test 2: Verificar 5 preguntas y Pregunta 3 personalizada
assert.strictEqual(QUESTIONS.length, 5, 'Debe haber exactamente 5 preguntas');
const q3 = QUESTIONS.find(q => q.id === 'q3');
assert.strictEqual(q3.text, '¿Qué tanto te hace pensar en tu amorcito?', 'La pregunta 3 debe ser "¿Qué tanto te hace pensar en tu amorcito?"');
console.log('✔ Preguntas verificadas (5 preguntas, con texto de amorcito en Q3)');

// Test 3: Verificar fórmula exacta: 100 - (diff * 10)
const scoreSample = calculateItemScore(1.0, 5.0);
assert.strictEqual(scoreSample, 60, 'Fórmula de ejemplo: |1 - 5| * 10 = 40; 100 - 40 = 60');

const scoreSame = calculateItemScore(8.5, 8.5);
assert.strictEqual(scoreSame, 100, 'Misma calificación debe dar 100%');

const scoreDiff1 = calculateItemScore(9.2, 8.2);
assert.strictEqual(scoreDiff1, 90, 'Diferencia de 1.0 debe dar 90%');
console.log('✔ Fórmula matemática de compatibilidad verificada exactamente');

// Test 4: Exportación e importación de archivo JSON
const initialRatings = createInitialRatings();
initialRatings['who-will-save-you-now']['q1'] = 1.0;
initialRatings['who-will-save-you-now']['q2'] = 8.0;

const exportPayload = buildExportPayload(initialRatings, 'Fer');
const jsonString = JSON.stringify(exportPayload);
const parsedPayload = parseImportPayload(jsonString);

assert.strictEqual(parsedPayload.userName, 'Fer');
assert.strictEqual(parsedPayload.ratings['who-will-save-you-now']['q1'], 1.0);
assert.strictEqual(parsedPayload.ratings['who-will-save-you-now']['q2'], 8.0);
console.log('✔ Generación y parseo de archivo JSON verificado');

// Test 5: Comparativa completa con uso significativo de nombres
const partnerRatings = createInitialRatings();
partnerRatings['who-will-save-you-now']['q1'] = 5.0; // diff = 4, score = 60
partnerRatings['who-will-save-you-now']['q2'] = 8.0; // diff = 0, score = 100

const compResult = compareData(initialRatings, partnerRatings, 'Fer', 'Amorcito');
assert.ok(compResult.overallScore > 0, 'Debe calcular score global');
assert.ok(compResult.generosityInsight, 'Debe incluir insight de generosidad');
assert.ok(compResult.favSongA, 'Debe incluir canción favorita de A');
assert.ok(compResult.favSongB, 'Debe incluir canción favorita de B');
assert.ok(compResult.bestSong, 'Debe incluir mejor canción');
assert.ok(compResult.debateSong, 'Debe incluir canción de mayor debate');

const song1 = compResult.songBreakdowns.find(s => s.songId === 'who-will-save-you-now');
assert.strictEqual(song1.questions[0].score, 60, 'Score de Q1 en Who Will Save You Now debe ser 60%');
assert.strictEqual(song1.questions.length, 5, 'Cada canción debe contener sus 5 preguntas en el desglose');
console.log('✔ Comparación completa y preguntas por canción verificadas');

console.log('\n🎉 ¡TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE!');
