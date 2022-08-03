const mongoose = require("mongoose");
const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  creationDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

const Report = mongoose.model("Report", reportSchema);

exports.Report = Report;
