const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const collectionLikeSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    required: true,
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

const CollectionLike = mongoose.model("CollectionLike", collectionLikeSchema);

exports.CollectionLike = CollectionLike;
