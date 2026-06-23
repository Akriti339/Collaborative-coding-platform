const mongoose = require("mongoose");

const ProblemSchema = new mongoose.Schema({
  title: String,
  difficulty: String,

  description: String,
  inputFormat: String,
  outputFormat: String,
  constraints: String,

  examples: [
    {
      input: String,
      output: String,
    },
  ],

  visibleTestCases: [
    {
      input: String,
      expectedOutput: String,
    },
  ],

  hiddenTestCases: [
    {
      input: String,
      expectedOutput: String,
    },
  ],
});

module.exports = mongoose.model(
  "Problem",
  ProblemSchema
);