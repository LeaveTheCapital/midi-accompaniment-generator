// Generate all major scales
const mapping = [0, 2, 4, 5, 7, 9, 11];
const scales = {};
for (let i = 0; i < 12; i++) {
  scales[i.toString()] = {
    notes: mapping.map(note => (note + i) % 12),
    numberOfMatches: 0,
    confidence: 0
  };
}

console.log("starting...");
const notesPlayed = [];
let scaleWithMostMatches = [];

const numberOfNotesToConsider = 9;

let inputChannel = 1;
let outputChannel = 1;

let accompanimentTypePreference = "harmony";
const interval = 3;

let matchingNotes = new Set();

displayNumberOfNotes();
attachAccompanimentTypeHandlers();
attachMidiChannelChangeHandlers();

// const output = JZZ()
// .or("Cannot start MIDI engine!")
// .openMidiOut()
// .or("Cannot open MIDI Out port!")
// .and(() => {
//   console.log("hello");
// });

const input = JZZ()
  .or("Cannot start MIDI engine!")
  .openMidiIn()
  .and(function() {
    console.log("MIDI-in ", this.name());
  })
  .connect(JZZ().openMidiOut())
  .connect(msg => {
    const a = msg.toString();
    if (!a.includes("Timing") && !a.includes("Active")) {
      var note = msg.getNote();
      console.log(a);
      console.log(note);
      // console.log(msg);
      input.note(outputChannel, note, 100, 500);
    }
  });

// JZZ.enable(function(err) {
//     console.log("WebMidi enabled!");

//     let input = JZZ.getInputByName("EIE");
//     let output = JZZ.getOutputByName("EIE");

//     console.log(input);
//     input.addListener("noteon", inputChannel, function(e) {
//       console.log(
//         "Received 'noteon' message (" + e.note.name + e.note.octave + ").",
//         e.note.number
//       );

//       notesPlayed.push(e.note.number % 12);

//       const last10Notes = notesPlayed.slice(
//         -numberOfNotesToConsider,
//         notesPlayed.length
//       );

//       const possibleNotes = getPotentialNotes(last10Notes);

//       if (notesPlayed.length > 5) {
//         const randomNote =
//           possibleNotes[Math.ceil(Math.random() * (possibleNotes.length - 1))];

//         console.log("random note", randomNote);

//         const randomOctave = Math.ceil(Math.random() * 2);

//         const notePlusInterval = e.note.number + interval;
//         let noteToPlay = scaleWithMostMatches.includes(notePlusInterval % 12)
//           ? e.note.number + interval
//           : notePlusInterval + 1;

//         if (accompanimentTypePreference === "random") {
//           // play a random note from notes already played
//           console.log("will play note", randomNote + 48 + randomOctave * 12);

//           output.playNote(randomNote + 48 + randomOctave * 12, outputChannel, {
//             time: WebMidi.time + 10,
//             duration: 500,
//             velocity: 0.75
//           });
//         } else if (accompanimentTypePreference === "other") {
//           // play a random note from scale with most matches from last n notes
//           console.log("will play note", randomNoteFromScaleWithMostMatches);

//           output.playNote(
//             randomNoteFromScaleWithMostMatches + 48 + randomOctave * 12,
//             outputChannel,
//             {
//               time: WebMidi.time + 30,
//               duration: 500,
//               velocity: 0.75
//             }
//           );
//         } else if (accompanimentTypePreference === "harmony") {
//           // play harmony 3 or 4 semitones above
//           console.log("will play note", noteToPlay);
//           output.playNote(noteToPlay, outputChannel, {
//             time: WebMidi.time + 10,
//             duration: 500,
//             velocity: 0.75
//           });
//         }
//       }
//     });
//   }
// });

// let startButton = document.getElementById("start");
// startButton.onclick = function() {
//   console.log(WebMidi.inputs);
//   console.log(WebMidi.outputs);
//   let output = WebMidi.getOutputByName("EIE");
//   console.log("yolo", output);
//   for (let i = 1; i < 9; i++) {
//     output.playNote(`C${i}`, 1, { time: WebMidi.time * i });
//     output.playNote(`F${i}`, 1, { time: WebMidi.time * i + 150 });
//     output.playNote(`A${i}`, 1, { time: WebMidi.time * i + 225 });
//     console.log(WebMidi.time);
//     let context = new AudioContext();
//     let oscillator = context.createOscillator();
//     console.log(oscillator);
//     oscillator.frequency.value = 200;

//     oscillator.connect(context.destination);

//     oscillator.start(0);
//   }

/* output.playNote("D6", 1, {time: 600});
		output.playNote(100, 1, {time: 800});		
		output.playNote("G2", 1, {time: 100}); */
/* .sendPitchBend(-0.5, 1, {time: 400}) // After 400 ms.
    .sendPitchBend(0.5, 1, {time: 1200})  // After 800 ms.
    .sendPitchBend(-0.5, 1, {time: 400}) // After 400 ms.
    .sendPitchBend(0.5, 1, {time: 1200})  // After 800 ms.
    .stopNote("G5", 1, {time: 1000});    // After 1.2 s. */
// };

function displayNumberOfNotes() {
  let h2 = document.getElementById("numberOfNotes");
  h2.innerText = `Considering last ${numberOfNotesToConsider} notes`;
}

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
    const potentialNotes = _.intersection(
      ...scalesToUse.map(scale => scales[scale].notes)
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
  //   scalesToUse.map(scale => scales[scale].confidence)
  // );
  // console.log("scaleOfChoice", scaleOfChoice);
  // console.log("scaleOfChoice confidence", scaleOfChoice.confidence);

  // console.log("finalNotes", finalNotes);

  return finalNotes;
}

function attachAccompanimentTypeHandlers() {
  const radios = document.getElementsByName("accompanimentType");
  for (let i = 0; i < radios.length; i++) {
    radios[i].onclick = function() {
      accompanimentTypePreference = radios[i].value;
      console.log("preference set to ", accompanimentTypePreference);
    };
  }
}

function attachMidiChannelChangeHandlers() {
  const inputChannelEle = document.getElementById("inputChannelSelect");
  inputChannelEle.onclick = function(e) {
    inputChannel = +e.target.value;
  };
  const outputChannelEle = document.getElementById("outputChannelSelect");
  outputChannelEle.onclick = function(e) {
    outputChannel = +e.target.value;
  };
}
