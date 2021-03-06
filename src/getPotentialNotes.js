const { intersection } = require("lodash");

/**
 * getPotentialNotes calculates which scale(s) are being played with highest likelihood, returns the first scale and the potential notes. If more than one scale, will get only potential notes which are in ALL of those scales to avoid playing notes out of key.
 * @param  {Array} notesPlayed recently played notes
 * @param  {scales} scales object containing all major scale information
 * @return {Object}      possibleNotes - array of all notes which can be played as accompaniment, scaleOfChoice - most likely scale being played
 */
function getPotentialNotes(notesPlayed, scales, scaleWithMostMatches) {
  let mostSoFar = 0;
  let countWithMostMatches = 0;
  let scalesToUse = [];
  let scaleOfChoice = null;
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
    console.log({ potentialNotes });
    console.log({ scalesToUse });
    const potentialNotesSet = new Set(potentialNotes);
    finalNotes = Array.from(potentialNotesSet);
  }

  return { possibleNotes: finalNotes, scaleOfChoice: scaleOfChoice };
}
exports.getPotentialNotes = getPotentialNotes;
