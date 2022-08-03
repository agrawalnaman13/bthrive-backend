const mongoose = require("mongoose");
const blogSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  link: {
    type: String,
    required: false,
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

blogSchema.index({ "$**": "text" });
const Blog = mongoose.model("Blog", blogSchema);

exports.Blog = Blog;
