const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: true,
    enum: ["comment", "insight"],
  },
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive", "trashed"],
    default: "active",
  },
  showStatus: {
    type: String,
    required: true,
    enum: ["approved", "declined", "waiting"],
    default: "waiting",
  },
  creationDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  isRead: { type: Boolean, required: false, default: false },
});

const Comment = mongoose.model("Comment", commentSchema);

exports.Comment = Comment;
