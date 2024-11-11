import { getPotentialNotes } from "./getPotentialNotes";
import { generateMajorScales, scaleLookup } from "./generateMajorScales";

// const WebMidi = require("webmidi");
import { Input, NoteMessageEvent, Output, WebMidi } from "webmidi";
import { NoteOnMessage } from "./interfaces/INoteOnMessage";

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    notesPlayed: number[];
  }
}

type scaleNumber =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11";

// Generate all major scales
const scales = generateMajorScales();

window.notesPlayed = [];
let scaleWithMostMatches: number[] = [];

const numberOfNotesToConsider = 9;

let inputChannel = 1;
let outputChannel = 1;

let accompanimentTypePreference = "random_from_detected_scale";
const interval = 3;

displayNumberOfNotes();
attachAccompanimentTypeHandlers();
appendOptionsToChannelSelectElement("input");
appendOptionsToChannelSelectElement("output");
appendChannelSelectListeners();

function appendOptionsToDeviceSelectElement (
  namesArray: string[],
  selectEle: HTMLSelectElement,
  inputOrOutput: string
) {
  const addSelectedIfFirstOptionOrFoundInLocalStorage = (
    index: number,
    deviceName: string,
    inputOrOutput: string
  ) =>
    index === 0 || deviceName === localStorage.getItem(`${inputOrOutput}Device`)
      ? " selected"
      : "";
  namesArray.forEach((inputName, index) => {
    const optionEle =
      "<option value='" +
      index +
      "'" +
      addSelectedIfFirstOptionOrFoundInLocalStorage(
        index,
        inputName,
        inputOrOutput
      ) +
      ">" +
      inputName +
      "</option>";
    selectEle.innerHTML += optionEle;
  });
}

let input: Input;
let output: Output;

export function noteOnListener (
  e: NoteOnMessage
  // , notesPlayed: number[]
) {
  console.log(
    "Received 'noteon' message (" + e.note.name + e.note.octave + ").",
    e.note.number
  );

  const pureNoteNumber = e.note.number % 12;
  const pureNoteNumberAsString = pureNoteNumber.toString() as scaleNumber;
  const pureNoteName = scaleLookup[pureNoteNumberAsString];
  const matchingKeyFromKeyboardEle =
    document.getElementsByClassName(pureNoteName)[0];
  const activeKeyboardElements = Array.from(
    document.getElementsByClassName("active")
  );
  if (activeKeyboardElements.length > 0) {
    activeKeyboardElements.forEach(function (el) {
      el.classList.remove("active");
    });
  }
  if (matchingKeyFromKeyboardEle) {
    matchingKeyFromKeyboardEle.className += " active";
  }

  window.notesPlayed.push(pureNoteNumber);

  const lastNNotes = window.notesPlayed.slice(
    -numberOfNotesToConsider,
    window.notesPlayed.length
  );

  const { possibleNotes, scaleOfChoice } = getPotentialNotes(
    lastNNotes,
    scales,
    scaleWithMostMatches
  );

  scaleWithMostMatches = scaleOfChoice?.notes ?? [];

  const detectedScaleElement = document.getElementById("detected-scale");
  if (detectedScaleElement !== null) {
    detectedScaleElement.innerText = scaleOfChoice?.name ?? "";
  }

  let noteToPlay = e.note.number;

  if (window.notesPlayed.length > 5) {
    const randomOctave = Math.ceil(Math.random() * 2);

    if (accompanimentTypePreference === "random_from_already_played") {
      const randomNoteFromAlreadyPlayed =
        lastNNotes[Math.ceil(Math.random() * (lastNNotes.length - 1))];
      // play a random note from notes already played
      const randomNoteFromAlreadyPlayedAsString =
        randomNoteFromAlreadyPlayed.toString() as scaleNumber;
      console.log(
        "random_from_already_played: will play note",
        scaleLookup[randomNoteFromAlreadyPlayedAsString]
      );

      noteToPlay = randomNoteFromAlreadyPlayed + 48 + randomOctave * 12;

      output.playNote(noteToPlay, {
        channels: outputChannel,
        time: WebMidi.time + 10,
        duration: 500,
        attack: 0.75 // changed velocity to attack
      });
    } else if (accompanimentTypePreference === "random_from_detected_scale") {
      // play a random note from scale with most matches from last n notes
      const randomNoteFromScaleWithMostMatches =
        possibleNotes[Math.ceil(Math.random() * (possibleNotes.length - 1))];

      noteToPlay = possibleNotes.length
        ? randomNoteFromScaleWithMostMatches + 48 + randomOctave * 12
        : e.note.number;
      const noteToPlayPureNoteNumber = noteToPlay % 12;
      const noteToPlayPureNoteNumberAsString =
        noteToPlayPureNoteNumber.toString() as scaleNumber;
      console.log(
        "random_from_detected_scale: will play note",
        // scaleLookup[randomNoteFromScaleWithMostMatches]
        scaleLookup[noteToPlayPureNoteNumberAsString]
      );

      output.playNote(noteToPlay, {
        channels: outputChannel,
        time: WebMidi.time + 30,
        duration: 500,
        attack: 0.75 // changed velocity to attack
      });
    } else if (accompanimentTypePreference === "harmony") {
      // play harmony 3 or 4 semitones above
      // modulo 127 so note doesn't go above 127
      const notePlusInterval = (e.note.number + interval) % 127;
      const harmonyNoteToPlay = scaleWithMostMatches.includes(
        notePlusInterval % 12
      )
        ? notePlusInterval
        : (notePlusInterval + 1) % 127;

      noteToPlay = harmonyNoteToPlay;

      const pureHarmonyNoteToPlayAsString = (
        harmonyNoteToPlay % 12
      ).toString() as scaleNumber;

      console.log(
        "harmony: will play note",
        scaleLookup[pureHarmonyNoteToPlayAsString]
      );
      output.playNote(noteToPlay, {
        channels: outputChannel,
        time: WebMidi.time + 10,
        duration: 500,
        attack: 0.75 // changed velocity to attack
        // velocity: 0.75,
      });
    }
  }

  // return noteToPlay;
}

WebMidi.enable({
  callback: function (err: Error) {
    if (err) {
      console.log("WebMidi could not be enabled.", err);
    } else {
      console.log("WebMidi enabled!111");

      const inputSelectEle = document.getElementById(
        "input-device-select"
      ) as HTMLSelectElement;
      const inputNames = WebMidi.inputs.map((input) => input.name);
      appendOptionsToDeviceSelectElement(inputNames, inputSelectEle, "input");
      inputSelectEle?.addEventListener("change", inputSelectChanged);

      const outputSelectEle = document.getElementById(
        "output-device-select"
      ) as HTMLSelectElement;
      const outputNames = WebMidi.outputs.map((input) => input.name);
      appendOptionsToDeviceSelectElement(
        outputNames,
        outputSelectEle,
        "output"
      );
      outputSelectEle?.addEventListener("change", outputSelectChanged);

      const selectedInputElementChosenIndex = parseInt(inputSelectEle?.value);
      const selectedOutputElementChosenIndex = parseInt(outputSelectEle?.value);
      const locallyStoredInput = localStorage.getItem("inputDevice");
      input =
        WebMidi.inputs.find((input) => input.name === locallyStoredInput) ||
        WebMidi.inputs[selectedInputElementChosenIndex || 0];
      output = WebMidi.outputs[selectedOutputElementChosenIndex || 0];

      input?.addListener(
        "noteon",
        (e: NoteMessageEvent) =>
          noteOnListener(
            e
            // , notesPlayed
          ),
        { channels: inputChannel }
      );
    }
  }
});

const startButton = document.getElementById("start");
if (startButton) {
  startButton.onclick = function () {
    console.log(WebMidi.inputs);
    console.log(WebMidi.outputs);
    // let output = WebMidi.getOutputByName("EIE");
    const output = WebMidi.outputs[0];
    for (let i = 1; i < 9; i++) {
      output.playNote(`C${i}`, { channels: 1, time: WebMidi.time * i });
      output.playNote(`F${i}`, { channels: 1, time: WebMidi.time * i + 150 });
      output.playNote(`A${i}`, { channels: 1, time: WebMidi.time * i + 225 });
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
}

function displayNumberOfNotes () {
  const ele = document.getElementById("numberOfNotes");
  if (ele) {
    ele.innerHTML = `Considering last <span class="number-of-notes">${numberOfNotesToConsider}</span> notes`;
  }
}

function attachAccompanimentTypeHandlers () {
  const radios = document.getElementsByName(
    "accompaniment-type"
    // eslint-disable-next-line no-undef
  ) as NodeListOf<HTMLInputElement>;
  for (let i = 0; i < radios.length; i++) {
    radios[i].onclick = function () {
      accompanimentTypePreference = radios[i].value;
      console.log("preference set to ", accompanimentTypePreference);
    };
  }
}

function appendOptionsToChannelSelectElement (
  inputOrOutput: "input" | "output"
) {
  const ele = document.getElementById(`${inputOrOutput}-channel-select`);
  for (let channel = 1; channel <= 16; channel++) {
    const optionEle =
      "<option value='" + channel + "'>" + channel + "</option>";
    if (ele) {
      ele.innerHTML += optionEle;
    }
  }
}

function appendChannelSelectListeners () {
  const inputChannelEle = document.getElementById("input-channel-select");
  const outputChannelEle = document.getElementById("output-channel-select");
  if (inputChannelEle) {
    inputChannelEle.addEventListener(
      "change",
      (evt) => (inputChannel = parseInt((<HTMLInputElement>evt.target).value))
    );
  }
  if (outputChannelEle) {
    outputChannelEle.addEventListener(
      "change",
      (evt) => (outputChannel = parseInt((<HTMLInputElement>evt.target).value))
    );
  }
}

function inputSelectChanged (evt: Event) {
  input.removeListener("noteon", noteOnListener, { channels: inputChannel });
  input = WebMidi.inputs[parseInt((<HTMLInputElement>evt.target).value)];
  input.addListener("noteon", noteOnListener, { channels: inputChannel });
  localStorage.setItem("inputDevice", input.name);
  console.log("input is now", input.name);
}

function outputSelectChanged (evt: Event) {
  output = WebMidi.outputs[parseInt((<HTMLInputElement>evt.target).value)];
  localStorage.setItem("outputDevice", output.name);
  console.log("output is now", output.name);
}

exports.noteOnListener = noteOnListener;
