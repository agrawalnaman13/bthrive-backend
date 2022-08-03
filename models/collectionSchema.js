const mongoose = require("mongoose");
const collectionSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: false,
    },
  ],
  bookClubPost: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookClubPost",
      required: false,
    },
  ],
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
    minlength: 3,
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

const Collection = mongoose.model("Collection", collectionSchema);

exports.Collection = Collection;
