const mongoose = require("mongoose");
const feedBackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  message: {
    type: String,
    required: true,
  },
  creationDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

const Feedback = mongoose.model("Feedback", feedBackSchema);

exports.Feedback = Feedback;
