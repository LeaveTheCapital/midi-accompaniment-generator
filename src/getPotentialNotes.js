const { intersection } = require("lodash");

// calculates which scale(s) are being played with highest likelihood, returns the first scale and the potential notes
// if more than one scale, will get only potential notes which are in ALL of those scales to avoid playing notes out of key.
function getPotentialNotes(notesPlayed, scales, scaleWithMostMatches) {
  let mostSoFar = 0;
  let countWithMostMatches = 0;
  let scalesToUse = [];
  let scaleOfChoice = undefined;
  for (const scale in scales) {
    if (scales.hasOwnProperty(scale)) {
      const currentScale = scales[scale];
      let nonMatches = 0;
      const allMatches = notesPlayed.filter((note) => {
        const isMatch = -1 !== currentScale.notes.indexOf(note);
        if (!isMatch) {
          nonMatches++;
        }
        return isMatch;
      });
      const uniqueMatches = new Set(allMatches);
      const numberOfMatches = uniqueMatches.size;
      currentScale.confidence =
        (notesPlayed.length - nonMatches) / notesPlayed.length;
      if (numberOfMatches > mostSoFar) {
        scalesToUse = [];
        countWithMostMatches = 1;
        mostSoFar = numberOfMatches;
        scaleOfChoice = currentScale;
        scalesToUse.push(scale);
        if (numberOfMatches === 7) {
          currentScale.numberOfMatches = numberOfMatches;
          break;
        }
      } else if (numberOfMatches === mostSoFar) {
        countWithMostMatches++;
        scalesToUse.push(scale);
      }
      currentScale.numberOfMatches = numberOfMatches;
    }
  }
  let finalNotes = scaleOfChoice.notes;
  scaleWithMostMatches = scaleOfChoice.notes;
  if (countWithMostMatches > 1) {
    const potentialNotes = intersection(
      ...scalesToUse.map((scale) => scales[scale].notes)
    );
    const potentialNotesSet = new Set(potentialNotes);
    finalNotes = Array.from(potentialNotesSet);
  }
  // console.log("mostSoFar", mostSoFar);
  // console.log("countWithMostMatches", countWithMostMatches);
  // console.log(
  //   "scalesToUse",
  //   scalesToUse,
  //   "confidenceInEach",
  //   scalesToUse.map((scale) => scales[scale].confidence)
  // );
  // console.log("scaleOfChoice", scaleOfChoice);
  // console.log("scaleOfChoice confidence", scaleOfChoice.confidence);
  console.log("finalNotes", finalNotes);
  return { possibleNotes: finalNotes, scaleOfChoice: scaleOfChoice };
}
exports.getPotentialNotes = getPotentialNotes;
