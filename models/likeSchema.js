const mongoose = require("mongoose");
const likeSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "onModel",
    required: true,
  },
  onModel: {
    type: String,
    required: false,
    enum: ["Post", "BookClubPost"],
  },
  type: {
    type: String,
    required: true,
    enum: [
      "11",
      "12",
      "13",
      "14",
      "21",
      "22",
      "23",
      "24",
      "31",
      "32",
      "33",
      "34",
      "41",
      "42",
      "43",
      "44",
      "5",
      "61",
      "62",
      "63",
      "64",
      "71",
      "72",
      "73",
      "74",
    ],
  },

  creationDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive", "trashed"],
    default: "active",
  },
  isRead: { type: Boolean, required: false, default: false },
});

const Like = mongoose.model("Like", likeSchema);

exports.Like = Like;
