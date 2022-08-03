const mongoose = require("mongoose");
const bookClubDataSchema = new mongoose.Schema({
  link: {
    type: String,
    required: false,
  },
});

bookClubDataSchema.index({ "$**": "text" });
const BookClubData = mongoose.model("bookClubData", bookClubDataSchema);

exports.BookClubData = BookClubData;
