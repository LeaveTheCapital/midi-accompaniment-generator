// Generate all major scales
const mapping = [0, 2, 4, 5, 7, 9, 11];
const scaleLookup = {
  "0": "C",
  "1": "C#",
  "2": "D",
  "3": "D#",
  "4": "E",
  "5": "F",
  "6": "F#",
  "7": "G",
  "8": "G#",
  "9": "A",
  "10": "A#",
  "11": "B",
};

const scales = {};
for (let i = 0; i < 12; i++) {
  scales[i.toString()] = {
    notes: mapping.map((note) => (note + i) % 12),
    numberOfMatches: 0,
    confidence: 0,
    name: scaleLookup[i],
  };
}

const notesPlayed = [];
let scaleWithMostMatches = [];

const numberOfNotesToConsider = 9;

let inputChannel = 1;
let outputChannel = 1;

let accompanimentTypePreference = "random";
const interval = 3;

displayNumberOfNotes();
attachAccompanimentTypeHandlers();
appendOptionsToChannelSelectElement("input");
appendOptionsToChannelSelectElement("output");
appendChannelSelectListeners();

const addSelectedIfFirstOption = (index) => (index === 0 ? " selected" : "");

function appendOptionsToDeviceSelectElement(namesArray, selectEle) {
  namesArray.forEach((inputName, index) => {
    const optionEle =
      "<option value='" +
      index +
      "'" +
      addSelectedIfFirstOption(index) +
      ">" +
      inputName +
      "</option>";
    selectEle.innerHTML += optionEle;
  });
}

let input;
let output;

function noteOnListener(e) {
  console.log(
    "Received 'noteon' message (" + e.note.name + e.note.octave + ").",
    e.note.number
  );

  notesPlayed.push(e.note.number % 12);

  const lastNNotes = notesPlayed.slice(
    -numberOfNotesToConsider,
    notesPlayed.length
  );

  const possibleNotes = getPotentialNotes(lastNNotes);

  if (notesPlayed.length > 5) {
    const randomNote =
      possibleNotes[Math.ceil(Math.random() * (possibleNotes.length - 1))];

    const randomOctave = Math.ceil(Math.random() * 2);

    // modulo 127 so note doesn't go above 127
    const notePlusInterval = (e.note.number + interval) % 127;
    let noteToPlay = scaleWithMostMatches.includes(notePlusInterval % 12)
      ? (e.note.number + interval) % 127
      : notePlusInterval + 1;

    if (accompanimentTypePreference === "random") {
      // play a random note from notes already played
      console.log(
        "random: will play note",
        randomNote + 48 + randomOctave * 12
      );

      output.playNote(randomNote + 48 + randomOctave * 12, outputChannel, {
        time: WebMidi.time + 10,
        duration: 500,
        velocity: 0.75,
      });
    } else if (accompanimentTypePreference === "other") {
      // play a random note from scale with most matches from last n notes
      console.log("other: will play note", randomNoteFromScaleWithMostMatches);

      output.playNote(
        randomNoteFromScaleWithMostMatches + 48 + randomOctave * 12,
        outputChannel,
        {
          time: WebMidi.time + 30,
          duration: 500,
          velocity: 0.75,
        }
      );
    } else if (accompanimentTypePreference === "harmony") {
      // play harmony 3 or 4 semitones above
      console.log("harmony: will play note", noteToPlay);
      output.playNote(noteToPlay, outputChannel, {
        time: WebMidi.time + 10,
        duration: 500,
        velocity: 0.75,
      });
    }
  }
}
WebMidi.enable(function (err) {
  if (err) {
    console.log("WebMidi could not be enabled.", err);
  } else {
    console.log("WebMidi enabled!");

    const inputSelectEle = document.getElementById("input-device-select");
    const inputNames = WebMidi.inputs.map((input) => input.name);
    appendOptionsToDeviceSelectElement(inputNames, inputSelectEle);
    inputSelectEle.addEventListener("change", inputSelectChanged);

    const outputSelectEle = document.getElementById("output-device-select");
    const outputNames = WebMidi.outputs.map((input) => input.name);
    appendOptionsToDeviceSelectElement(outputNames, outputSelectEle);
    outputSelectEle.addEventListener("change", outputSelectChanged);

    const selectedInputElementChosenIndex = inputSelectEle.value;
    const selectedOutputElementChosenIndex = outputSelectEle.value;

    input = WebMidi.inputs[selectedInputElementChosenIndex];
    output = WebMidi.outputs[selectedOutputElementChosenIndex];

    input.addListener("noteon", inputChannel, noteOnListener);
  }
});

let startButton = document.getElementById("start");
startButton.onclick = function () {
  console.log(WebMidi.inputs);
  console.log(WebMidi.outputs);
  // let output = WebMidi.getOutputByName("EIE");
  let output = WebMidi.outputs[0];
  for (let i = 1; i < 9; i++) {
    output.playNote(`C${i}`, 1, { time: WebMidi.time * i });
    output.playNote(`F${i}`, 1, { time: WebMidi.time * i + 150 });
    output.playNote(`A${i}`, 1, { time: WebMidi.time * i + 225 });
    console.log(WebMidi.time);

    // try and play notes with AudioContext oscillator

    // let context = new AudioContext();
    // let oscillator = context.createOscillator();
    // console.log(oscillator);
    // oscillator.frequency.value = 200;

    // oscillator.connect(context.destination);

    // oscillator.start(0);
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

function getPotentialNotes(notesPlayed) {
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

  const detectedScaleElement = document.getElementById("detected-scale");
  detectedScaleElement.innerText = "Detected scale: " + scaleOfChoice.name;

  let finalNotes = scaleOfChoice.notes;

  scaleWithMostMatches = scaleOfChoice.notes;

  if (countWithMostMatches > 1) {
    const potentialNotes = _.intersection(
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
  //   scalesToUse.map(scale => scales[scale].confidence)
  // );
  // console.log("scaleOfChoice", scaleOfChoice);
  // console.log("scaleOfChoice confidence", scaleOfChoice.confidence);

  // console.log("finalNotes", finalNotes);

  return finalNotes;
}

function attachAccompanimentTypeHandlers() {
  const radios = document.getElementsByName("accompaniment-type");
  for (let i = 0; i < radios.length; i++) {
    radios[i].onclick = function () {
      accompanimentTypePreference = radios[i].value;
      console.log("preference set to ", accompanimentTypePreference);
    };
  }
}

function appendOptionsToChannelSelectElement(inputOrOutput) {
  const ele = document.getElementById(`${inputOrOutput}-channel-select`);
  for (let channel = 1; channel <= 16; channel++) {
    const optionEle =
      "<option value='" + channel + "'>" + channel + "</option>";
    ele.innerHTML += optionEle;
  }
}

function appendChannelSelectListeners() {
  const inputChannelEle = document.getElementById("input-channel-select");
  const outputChannelEle = document.getElementById("output-channel-select");
  inputChannelEle.addEventListener(
    "change",
    (evt) => (inputChannel = evt.target.value)
  );
  outputChannelEle.addEventListener(
    "change",
    (evt) => (outputChannel = evt.target.value)
  );
}

function inputSelectChanged(evt) {
  input.removeListener("noteon", inputChannel, noteOnListener);
  input = WebMidi.inputs[evt.target.value];
  input.addListener("noteon", inputChannel, noteOnListener);
  console.log("input is now", input.name);
}

function outputSelectChanged(evt) {
  output = WebMidi.outputs[evt.target.value];
  console.log("output is now", output.name);
}
