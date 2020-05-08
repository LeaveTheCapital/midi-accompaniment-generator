const { getPotentialNotes } = require("../src/getPotentialNotes");
const { generateMajorScales } = require("../src/generateMajorScales");
const chai = require("chai");
const expect = chai.expect;
const scales = generateMajorScales();
const scaleWithMostMatches = [];
const allNotes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const random_array = Array.from({ length: 6 }, () =>
  Math.floor(Math.random() * 9)
);

var combine = function (a, min) {
  var fn = function (n, src, got, all) {
    if (n == 0) {
      if (got.length > 0) {
        all[all.length] = got;
      }
      return;
    }
    for (var j = 0; j < src.length; j++) {
      fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
    }
    return;
  };
  var all = [];
  for (var i = min; i < a.length; i++) {
    fn(i, a, [], all);
  }
  all.push(a);
  return all;
};

// To use, supply an array, and the minimum subset length desired,

const subsets = combine(allNotes, 2);

// console.log("subsets", subsets);

const arrayOfArrays = [];
const lengthOfEachArrayOfNotes = 9;
const numberOfArraysToCreate = 100;

for (let i = 0; i < numberOfArraysToCreate; i++) {
  let randomNotes = [];
  for (let j = 0; j < lengthOfEachArrayOfNotes; j++) {
    const randomNum = Math.floor(Math.random() * Math.floor(12));
    randomNotes.push(allNotes[randomNum]);
  }
  arrayOfArrays.push(randomNotes);
}

// run through a lot of random arrays of notes to make sure nothing throws an error

arrayOfArrays.forEach((subset) => {
  const lastNNotes = subset.slice(-9, subset.length);
  const res = getPotentialNotes(lastNNotes, scales, scaleWithMostMatches);
});

describe("getPotentialNotes.js", function () {
  describe("#getPotentialNotes", function () {
    it("Full C Major Scale should return c major scale", function () {
      expect(
        getPotentialNotes([0, 2, 4, 5, 7, 9, 11], scales, scaleWithMostMatches)
          .possibleNotes
      ).to.have.same.members(scales[0].notes);
    });
    it("Full D Major Scale should return D major scale", function () {
      expect(
        getPotentialNotes([2, 4, 6, 7, 9, 11, 1], scales, scaleWithMostMatches)
          .possibleNotes
      ).to.have.same.members(scales[2].notes);
    });
    it("partial c and g scale", function () {
      expect(
        getPotentialNotes([0, 4, 7, 11], scales, scaleWithMostMatches)
          .possibleNotes
      ).to.have.same.members([0, 2, 4, 7, 9, 11]);
    });
    it("mixed notes", function () {
      expect(
        getPotentialNotes([0, 4, 7, 1, 3, 8], scales, scaleWithMostMatches)
          .possibleNotes
      ).to.have.same.members([8, 10, 0, 1, 3, 5, 7]);
    });
  });
});
