const CMajor = [0, 2, 4, 5, 7, 9, 11];
const GMajor = [0, 2, 4, 6, 7, 9, 11];
const FMajor = [0, 2, 4, 5, 7, 9, 10];

const mapping = [0, 2, 4, 5, 7, 9, 11];

const scales = {};

for (let i = 0; i < 12; i++) {
  scales[i.toString()] = {
    notes: mapping.map(note => (note + i) % 12),
    numberOfMatches: 0,
    confidence: 0
  };
}

const notes = [];

for (let i = 0; i < 20; i++) {
  const element = Math.ceil(Math.random() * 12) - 1;
  notes.push(element);
}
console.log(notes);

function getPotentialNotes(notesPlayed) {
  let mostSoFar = 0;

  let countWithMostMatches = 0;

  let scalesToUse = [];

  let scaleOfChoice = undefined;

  for (const scale in scales) {
    if (scales.hasOwnProperty(scale)) {
      const currentScale = scales[scale];
      let nonMatches = 0;
      const allMatches = notesPlayed.filter(note => {
        const isMatch = -1 !== currentScale.notes.indexOf(note);
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

  let finalNotes = scaleOfChoice.notes;

  if (countWithMostMatches > 1) {
    const potentialNotes = _.intersection(
      ...scalesToUse.map(scale => scales[scale].notes)
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
    scalesToUse.map(scale => scales[scale].confidence)
  );
  console.log("scaleOfChoice", scaleOfChoice);
  console.log("scaleOfChoice confidence", scaleOfChoice.confidence);

  console.log("finalNotes", finalNotes);

  return finalNotes;
}

const finalNotes = getPotentialNotes(notes);

let p = document.getElementById("display");
p.innerText = "display" + finalNotes;
