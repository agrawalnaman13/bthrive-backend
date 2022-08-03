const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  profileType: {
    type: String,
    required: true,
    enum: ["admin"],
    default: "admin",
  },
  profilePicture: {
    type: String,
    required: false,
    minlength: 3,
  },
  isAdmin: { type: Boolean, required: true, default: false },
  otp: {
    type: String,
    minlength: 5,
    maxlength: 1024,
  },
});

adminSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      isAdmin: this.isAdmin,
    },
    config.get("jwtprivatekey")
  );
  return token;
};

const Admin = mongoose.model("Admin", adminSchema);

exports.Admin = Admin;
