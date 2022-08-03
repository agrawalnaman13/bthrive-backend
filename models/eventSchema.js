const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  host_email: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  creationDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  imagePath: {
    type: String,
    required: false,
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  ],
});

eventSchema.index({ "$**": "text" });
const EventDetails = mongoose.model("Event", eventSchema);

exports.EventDetails = EventDetails;
