const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    unique: true,
  },

  code: String,

  language: {
    type: String,
    default: "cpp",
  },

  problem: {
    title: String,
    description: String,
    inputFormat: String,
    outputFormat: String,
    constraints: String,
  },

  testCases: [
    {
      input: String,
      expectedOutput: String,
    },
  ],
});

module.exports = mongoose.model("Room", RoomSchema);