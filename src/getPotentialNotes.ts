import { intersection } from "lodash";
import { IScale } from "./interfaces/IScale";

/**
 * getPotentialNotes calculates which scale(s) are being played with highest likelihood, returns the first scale and the potential notes. If more than one scale is a potential match, will get only potential notes which are in ALL of those scales to avoid playing notes out of key.
 * @param  {Array} notesPlayed recently played notes
 * @param  {scales} scales object containing all major scale information
 * @return {Object}      possibleNotes - array of all notes which can be played as accompaniment, scaleOfChoice - most likely scale being played
 */
export function getPotentialNotes (
  notesPlayed: number[],
  scales: Record<string, IScale>,
  scaleWithMostMatches: number[]
) {
  let mostSoFar = 0;
  let countWithMostMatches = 0;
  let scalesToUse: string[] = [];
  let scaleOfChoice: IScale | null = null;
  for (const scaleName in scales) {
    // eslint-disable-next-line no-prototype-builtins
    if (scales.hasOwnProperty(scaleName)) {
      const currentScale = scales[scaleName];
      let nonMatches = 0;
      const allMatches = notesPlayed.filter((note) => {
        const isMatch = currentScale.notes.indexOf(note) !== -1;
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
        scalesToUse.push(scaleName);
        if (numberOfMatches === 7) {
          currentScale.numberOfMatches = numberOfMatches;
          break;
        }
      } else if (numberOfMatches === mostSoFar) {
        countWithMostMatches++;
        scalesToUse.push(scaleName);
      }
      currentScale.numberOfMatches = numberOfMatches;
    }
  }
  let finalNotes = scaleOfChoice?.notes || []; // what is expected default behaviour
  scaleWithMostMatches = scaleOfChoice?.notes ?? [];
  if (countWithMostMatches > 1) {
    const potentialNotes = intersection(
      ...scalesToUse.map((scale) => scales[scale].notes)
    );
    const potentialNotesSet = new Set(potentialNotes);
    finalNotes = Array.from(potentialNotesSet);
  }

  return { possibleNotes: finalNotes, scaleOfChoice };
}
