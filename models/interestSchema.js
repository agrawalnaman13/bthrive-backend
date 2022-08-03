const mongoose = require("mongoose");
const interestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
  },
  profilePicture: {
    type: String,
    required: false,
    minlength: 3,
  },
});

const Interest = mongoose.model("Interest", interestSchema);

exports.Interest = Interest;
