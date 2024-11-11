import { intersection } from "lodash";
import { IScale } from "./interfaces/IScale";

const majorScaleMapping = [0, 2, 4, 5, 7, 9, 11];

const scales: Record<string, IScale> = {};

for (let noteOfTheScales = 0; noteOfTheScales < 12; noteOfTheScales++) {
  scales[noteOfTheScales.toString()] = {
    notes: majorScaleMapping.map((note) => (note + noteOfTheScales) % 12),
    numberOfMatches: 0,
    confidence: 0
  };
}

const notes: number[] = [];

for (let i = 0; i < 20; i++) {
  const element = Math.ceil(Math.random() * 12) - 1;
  notes.push(element);
}
function getPotentialNotes (notesPlayed: number[]) {
  let mostSoFar = 0;

  let countWithMostMatches = 0;

  let scalesToUse: string[] = [];

  let scaleOfChoice: IScale | null = null;

  // TODO scales should probably not be mutated
  for (const scale in scales) {
    // eslint-disable-next-line no-prototype-builtins
    if (scales.hasOwnProperty(scale)) {
      const currentScale = scales[scale];
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
      currentScale.confidence = (notes.length - nonMatches) / notes.length;
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

  let finalNotes = scaleOfChoice?.notes ?? [];

  if (countWithMostMatches > 1) {
    const potentialNotes = intersection(
      ...scalesToUse.map((scale) => scales[scale].notes)
    );
    const potentialNotesSet = new Set(potentialNotes);
    finalNotes = Array.from(potentialNotesSet);
  }

  console.log("mostSoFar", mostSoFar);
  console.log("countWithMostMatches", countWithMostMatches);
  console.log(
    "scalesToUse",
    scalesToUse,
    "confidenceInEach",
    scalesToUse.map((scale) => scales[scale].confidence)
  );
  console.log("scaleOfChoice", scaleOfChoice);
  console.log("scaleOfChoice confidence", scaleOfChoice?.confidence ?? 0);

  console.log("finalNotes", finalNotes);

  return finalNotes;
}

const finalNotes = getPotentialNotes(notes);

const p = document.getElementById("display");
if (p) {
  p.innerText = "display" + finalNotes;
}
