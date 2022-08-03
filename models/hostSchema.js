const mongoose = require("mongoose");
const becomeAHostSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  idea: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    required: false,
  },
  requestDate: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  month: {
    type: Number,
    required: false,
  },
  year: {
    type: Number,
    required: false,
  },
  coverImage: {
    type: String,
    required: false,
  },
  isApproved: {
    type: Boolean,
    required: true,
    default: false,
  },
});

becomeAHostSchema.index({ "$**": "text" });
const BecomeHost = mongoose.model("Host", becomeAHostSchema);

exports.BecomeHost = BecomeHost;
