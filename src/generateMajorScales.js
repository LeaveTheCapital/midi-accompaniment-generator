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

function generateMajorScales() {
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
  // exports.scales = scales;
  for (let i = 0; i < 12; i++) {
    scales[i.toString()] = {
      notes: mapping.map((note) => (note + i) % 12),
      numberOfMatches: 0,
      confidence: 0,
      name: scaleLookup[i],
    };
  }
  return scales;
}

exports.generateMajorScales = generateMajorScales;
exports.scaleLookup = scaleLookup;
