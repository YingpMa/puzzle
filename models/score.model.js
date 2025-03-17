const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const scoreSchema = new Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
  playerName: { type: String, required: true },
  score: { type: Number, required: true },
  createdOn: { type: Date, default: new Date().getTime() },
});

module.exports = mongoose.model("Score", scoreSchema);
