import { SONGS, QUESTIONS } from './data.js';

const GENERAL_RATING_QUESTION_ID = 'q4';
const PREDICTION_QUESTION_ID = 'q5';

/**
 * Calculates compatibility score between two numbers (0-10)
 * Formula: 100 - (|A - B| * 10)
 */
export function calculateItemScore(valA, valB) {
  const diff = Math.abs(Number(valA) - Number(valB));
  const score = 100 - (diff * 10);
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/**
 * Compares dataA with dataB using both names meaningfully
 */
export function compareData(dataA, dataB, nameA = 'Tú', nameB = 'Tu Amorcito') {
  const songBreakdowns = [];
  const questionAverages = {};
  QUESTIONS.forEach((q) => {
    questionAverages[q.id] = {
      id: q.id,
      text: q.text,
      shortLabel: q.shortLabel,
      icon: q.icon,
      scores: [],
      scoresA: [],
      scoresB: [],
    };
  });

  let totalQuestionsCount = 0;
  let totalScoreSum = 0;
  let sumSongAveragesA = 0;
  let sumSongAveragesB = 0;

  const songScoresA = {};
  const songScoresB = {};

  SONGS.forEach((song) => {
    const questionsBreakdown = [];
    let songScoreSum = 0;
    const generalRatingA = Number(dataA[song.id]?.[GENERAL_RATING_QUESTION_ID] ?? 5.0);
    const generalRatingB = Number(dataB[song.id]?.[GENERAL_RATING_QUESTION_ID] ?? 5.0);

    QUESTIONS.forEach((q) => {
      const aVal = dataA[song.id]?.[q.id] ?? 5.0;
      const bVal = dataB[song.id]?.[q.id] ?? 5.0;
      let score;
      let diff;
      let predictionScoreA;
      let predictionScoreB;
      let predictionDiffA;
      let predictionDiffB;

      if (q.id === PREDICTION_QUESTION_ID) {
        // Keep each person's prediction accuracy separate.
        predictionScoreA = calculateItemScore(aVal, generalRatingB);
        predictionScoreB = calculateItemScore(bVal, generalRatingA);
        predictionDiffA = Math.round(Math.abs(aVal - generalRatingB) * 10) / 10;
        predictionDiffB = Math.round(Math.abs(bVal - generalRatingA) * 10) / 10;
        score = null;
        diff = null;
      } else {
        score = calculateItemScore(aVal, bVal);
        diff = Math.round(Math.abs(aVal - bVal) * 10) / 10;
      }

      questionsBreakdown.push({
        questionId: q.id,
        questionText: q.text,
        shortLabel: q.shortLabel,
        icon: q.icon,
        valA: aVal,
        valB: bVal,
        actualA: generalRatingA,
        actualB: generalRatingB,
        predictionScoreA,
        predictionScoreB,
        predictionDiffA,
        predictionDiffB,
        diff,
        score,
      });

      if (q.id === PREDICTION_QUESTION_ID) {
        questionAverages[q.id].scoresA.push(predictionScoreA);
        questionAverages[q.id].scoresB.push(predictionScoreB);
        // Count both individual prediction checks in the overall compatibility.
        songScoreSum += predictionScoreA + predictionScoreB;
        totalScoreSum += predictionScoreA + predictionScoreB;
        totalQuestionsCount += 2;
      } else {
        questionAverages[q.id].scores.push(score);
        songScoreSum += score;
        totalScoreSum += score;
        totalQuestionsCount++;
      }

    });

    // The overall rating and favorite song use the explicit general-rating answer.
    sumSongAveragesA += generalRatingA;
    sumSongAveragesB += generalRatingB;

    const songComparisonCount = QUESTIONS.length + 1;
    const songAvgScore = Math.round((songScoreSum / songComparisonCount) * 10) / 10;
    songScoresA[song.id] = generalRatingA;
    songScoresB[song.id] = generalRatingB;

    songBreakdowns.push({
      songId: song.id,
      title: song.title,
      trackNumber: song.trackNumber,
      tagline: song.tagline,
      avgScore: songAvgScore,
      questions: questionsBreakdown,
    });
  });

  // Calculate overall average compatibility
  const overallScore = totalQuestionsCount > 0
    ? Math.round((totalScoreSum / totalQuestionsCount) * 10) / 10
    : 0;

  // Process question categories
  const questionSummaries = Object.values(questionAverages).map((item) => {
    if (item.id === PREDICTION_QUESTION_ID) {
      const average = (scores) => scores.length
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
      return {
        ...item,
        averageScoreA: average(item.scoresA),
        averageScoreB: average(item.scoresB),
      };
    }
    const avg = item.scores.reduce((a, b) => a + b, 0) / (item.scores.length || 1);
    return {
      ...item,
      averageScore: Math.round(avg * 10) / 10,
    };
  });

  // Sort songs by compatibility
  const sortedSongs = [...songBreakdowns].sort((a, b) => b.avgScore - a.avgScore);
  const bestSong = sortedSongs[0];
  const debateSong = sortedSongs[sortedSongs.length - 1];

  // Meaningful Name Insights: Favorite songs for each person
  let favSongA = SONGS[0];
  let favSongB = SONGS[0];
  let maxScoreA = -1;
  let maxScoreB = -1;

  SONGS.forEach((song) => {
    if (songScoresA[song.id] > maxScoreA) {
      maxScoreA = songScoresA[song.id];
      favSongA = song;
    }
    if (songScoresB[song.id] > maxScoreB) {
      maxScoreB = songScoresB[song.id];
      favSongB = song;
    }
  });

  // Then average those per-song ratings so the insight compares each person's
  // overall rating across the album, independently of the compatibility score.
  const rawAvgRatingA = SONGS.length > 0 ? sumSongAveragesA / SONGS.length : 5;
  const rawAvgRatingB = SONGS.length > 0 ? sumSongAveragesB / SONGS.length : 5;
  const avgRatingA = rawAvgRatingA.toFixed(1);
  const avgRatingB = rawAvgRatingB.toFixed(1);

  let generosityInsight = '';
  if (avgRatingA === avgRatingB) {
    generosityInsight = `Ambos calificaron casi igual en promedio (${avgRatingA} ★ cada uno).`;
  } else if (rawAvgRatingA > rawAvgRatingB) {
    generosityInsight = `${nameA} calificó con más amor en promedio (${avgRatingA} ★ vs ${avgRatingB} ★).`;
  } else if (rawAvgRatingB > rawAvgRatingA) {
    generosityInsight = `${nameB} calificó con más amor en promedio (${avgRatingB} ★ vs ${avgRatingA} ★).`;
  } else {
    generosityInsight = `${nameB} calificó con más amor en promedio (${avgRatingB} ★ vs ${avgRatingA} ★).`;
  }

  const sortedQuestions = questionSummaries
    .filter((item) => Number.isFinite(item.averageScore))
    .sort((a, b) => b.averageScore - a.averageScore);
  const strongestQuestion = sortedQuestions[0];
  const weakestQuestion = sortedQuestions[sortedQuestions.length - 1];
  const questionInsights = [
    `Su mayor sintonía está en «${strongestQuestion.shortLabel}» (${strongestQuestion.averageScore}% de compatibilidad).`,
  ];
  if (weakestQuestion.id !== strongestQuestion.id) {
    questionInsights.push(`Donde más pueden debatir es «${weakestQuestion.shortLabel}» (${weakestQuestion.averageScore}% de compatibilidad).`);
  }

  return {
    nameA,
    nameB,
    overallScore,
    bestSong,
    debateSong,
    favSongA: { ...favSongA, score: maxScoreA },
    favSongB: { ...favSongB, score: maxScoreB },
    generosityInsight,
    questionInsights,
    songBreakdowns,
    questionSummaries,
    totalComparisons: totalQuestionsCount,
  };
}
