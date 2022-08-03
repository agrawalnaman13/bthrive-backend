const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    minlength: 2,
  },
  email: {
    type: String,
    required: function () {
      if (
        (this.linkedinId === null || this.linkedinId === "") &&
        (this.googleId === null || this.googleId === "")
      )
        return true;
      return false;
    },
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      if (
        (this.linkedinId === null || this.linkedinId === "") &&
        (this.googleId === null || this.googleId === "")
      )
        return true;
      return false;
    },
    minlength: 5,
    maxlength: 1024,
  },
  facebookId: {
    type: String,
    required: false,
    minlength: 5,
    maxlength: 255,
  },
  googleId: {
    type: String,
    required: false,
    minlength: 5,
    maxlength: 255,
  },
  linkedinId: {
    type: String,
    required: false,
    minlength: 5,
    maxlength: 255,
  },
  website: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  origin: {
    type: String,
    required: false,
  },
  blogLink: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  profilePicture: {
    type: String,
    required: false,
    minlength: 3,
  },
  coverPicture: {
    type: String,
    required: false,
    minlength: 3,
  },
  profileType: {
    type: String,
    required: true,
    enum: ["user", "admin"],
    default: "user",
  },
  otp: {
    type: String,
    minlength: 5,
    maxlength: 1024,
  },
  accountCreationDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  registerationStatus: {
    type: Boolean,
    required: true,
    default: false,
  },
  interest: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interest",
      required: false,
    },
  ],
  isApproved: {
    type: Boolean,
    required: true,
    default: false,
  },
  isFirst: {
    type: Boolean,
    required: true,
    default: true,
  },
  loginTime: {
    type: Date,
    default: Date.now(),
    required: false,
  },
  numberOfLogins: {
    type: Number,
    default: 1,
    required: false,
  },
  averageTimeSpent: {
    type: Number,
    default: 0,
    required: false,
  },

  usersBlocked: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  ],
  postsBookmarked: [{ type: mongoose.Schema.Types.ObjectId, ref: "Posts" }],
  isAdmin: { type: Boolean, required: true, default: false },
  isBlogger: { type: Boolean, required: false, default: false },
  isCompleted: { type: Boolean, required: true, default: false },
  isVerified: { type: Boolean, required: true, default: false },
  isCollaborated: { type: Boolean, required: true, default: false },
  registeredWithGoogle: { type: Boolean, required: true, default: false },
  registeredWithLinkedin: { type: Boolean, required: true, default: false },
  isLoggedIn: { type: Boolean, required: false, default: true },
  isDeactivated: { type: Boolean, required: false, default: false },
  followedBookClub: { type: Boolean, required: false, default: false },
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive"],
    default: "active",
  },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      isAdmin: this.isAdmin,
      profileType: this.profileType,
      usersBlocked: this.usersBlocked,
    },
    config.get("jwtprivatekey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);

exports.User = User;
