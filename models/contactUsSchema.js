const mongoose = require("mongoose");
const contactUsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: false,
  },
  message: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  creationDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

const ContactUs = mongoose.model("ContactUs", contactUsSchema);

exports.ContactUs = ContactUs;
