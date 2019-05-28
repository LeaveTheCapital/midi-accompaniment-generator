const scales = {
  cMajorScale: [0, 2, 4, 5, 7, 9, 11],
  gMajorScale: [0, 2, 4, 6, 7, 9, 11]
};

const notesPlayed = [];

const numberOfNotesToConsider = 9;

let playRandom = false;

const interval = 3;

let matchingNotes = new Set();

displayNumberOfNotes();

let scaleWithMostMatches = { scaleName: "", numberMatches: 0 };

WebMidi.enable(function(err) {
  if (err) {
    console.log("WebMidi could not be enabled.", err);
  } else {
    console.log("WebMidi enabled!");

    let input = WebMidi.getInputByName("EIE");
    let output = WebMidi.getOutputByName("EIE");

    console.log(input);
    input.addListener("noteon", "all", function(e) {
      console.log(
        "Received 'noteon' message (" + e.note.name + e.note.octave + ").",
        e.note.number
      );

      notesPlayed.push(e.note.number % 12);

      const last10Notes = notesPlayed.slice(
        -numberOfNotesToConsider,
        notesPlayed.length
      );

      const numberOfCMatches = last10Notes.reduce((acc, ele) => {
        if (scales.cMajorScale.includes(ele)) {
          acc++;
        }
        return acc;
      }, 0);

      // get all notes from all scales in a set
      for (const scaleName in scales) {
        if (scales.hasOwnProperty(scaleName)) {
          const scale = scales[scaleName];
          const allMatches = scale.filter(note =>
            last10Notes.includes(note % 12)
          );

          allMatches.forEach(note => matchingNotes.add(note));
        }
      }

      // get the scale with the most matches
      for (const scaleName in scales) {
        if (scales.hasOwnProperty(scaleName)) {
          const scale = scales[scaleName];
          const numberOfMatchesInScale = scale.reduce((acc, note) => {
            if (last10Notes.includes(note % 12)) {
              acc++;
            }
            return acc;
          }, 0);
          console.log(scaleName, "number of matches", numberOfMatchesInScale);
          if (numberOfMatchesInScale > scaleWithMostMatches.numberMatches) {
            scaleWithMostMatches.scaleName = scaleName;
            scaleWithMostMatches.numberMatches = numberOfMatchesInScale;
          }
        }
      }

      const matchingNotesArr = Array.from(matchingNotes);

      // matchingNotes.forEach(note => console.log(note));
      console.log(matchingNotesArr);

      // const cConfidence = numberOfCMatches / Math.max(last10Notes.length, 1);

      console.log(
        "c matches",
        numberOfCMatches,
        "notes considered",
        last10Notes.length
      );

      if (notesPlayed.length > 5) {
        const randomNote =
          matchingNotesArr[
            Math.ceil(Math.random() * (matchingNotesArr.length - 1))
          ];

        console.log("random note", randomNote);

        const randomNoteFromScaleWithMostMatches =
          scales[scaleWithMostMatches.scaleName][Math.ceil(Math.random() * 6)];

        const randomOctave = Math.ceil(Math.random() * 3);

        const notePlusInterval = e.note.number + interval;
        let noteToPlay = scales.cMajorScale.includes(notePlusInterval % 12)
          ? e.note.number + interval
          : notePlusInterval + 1;

        if (playRandom) {
          // play a random note from notes already played
          console.log("will play note", randomNote + 60 + randomOctave * 12);

          output.playNote(randomNote + 48 + randomOctave * 12, 1, {
            time: WebMidi.time + 30,
            duration: 500,
            velocity: 0.75
          });
        } else if (!playRandom) {
          // play a random note from scale with most matches from last n notes
          console.log("will play note", randomNoteFromScaleWithMostMatches);

          output.playNote(
            randomNoteFromScaleWithMostMatches + 48 + randomOctave * 12,
            1,
            {
              time: WebMidi.time + 30,
              duration: 500,
              velocity: 0.75
            }
          );
        } else {
          // play harmony 3 or 4 semitones above
          console.log("will play note", noteToPlay);
          output.playNote(noteToPlay, 1, {
            time: WebMidi.time + 10,
            duration: 500,
            velocity: 0.75
          });
        }
      }
    });
  }
});

let startButton = document.getElementById("start");
startButton.onclick = function() {
  console.log(WebMidi.inputs);
  console.log(WebMidi.outputs);
  let output = WebMidi.getOutputByName("EIE");
  console.log("yolo", output);
  for (let i = 1; i < 9; i++) {
    output.playNote(`C${i}`, 1, { time: WebMidi.time * i });
    output.playNote(`F${i}`, 1, { time: WebMidi.time * i + 150 });
    output.playNote(`A${i}`, 1, { time: WebMidi.time * i + 225 });
    console.log(WebMidi.time);
    let context = new AudioContext();
    let oscillator = context.createOscillator();
    console.log(oscillator);
    oscillator.frequency.value = 200;

    oscillator.connect(context.destination);

    oscillator.start(0);
  }

  /* output.playNote("D6", 1, {time: 600});
		output.playNote(100, 1, {time: 800});		
		output.playNote("G2", 1, {time: 100}); */
  /* .sendPitchBend(-0.5, 1, {time: 400}) // After 400 ms.
    .sendPitchBend(0.5, 1, {time: 1200})  // After 800 ms.
    .sendPitchBend(-0.5, 1, {time: 400}) // After 400 ms.
    .sendPitchBend(0.5, 1, {time: 1200})  // After 800 ms.
    .stopNote("G5", 1, {time: 1000});    // After 1.2 s. */
};

function displayNumberOfNotes() {
  let h2 = document.getElementById("numberOfNotes");
  h2.innerText = `Considering last ${numberOfNotesToConsider} notes`;
}
