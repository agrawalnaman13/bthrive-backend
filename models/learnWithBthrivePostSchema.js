const mongoose = require("mongoose");
const postSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  web_link: {
    type: String,
    required: false,
  },
  link: {
    type: String,
    required: false,
  },
  interest: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interest",
      required: false,
    },
  ],
  images: [
    {
      type: String,
      required: false,
    },
  ],
  videos: [
    {
      type: String,
      required: false,
    },
  ],
  type: {
    type: String,
    required: true,
    enum: ["post", "question"],
  },
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive", "trashed"],
    default: "active",
  },
  creationDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

postSchema.index({ "$**": "text" });
const LearnWithBthrivePost = mongoose.model("LearnWithBthrivePost", postSchema);

exports.LearnWithBthrivePost = LearnWithBthrivePost;
