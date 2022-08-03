const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const config = require("config");
const axios = require("axios");
const qs = require("query-string");
const { OAuth2Client } = require("google-auth-library");
const urlToGetLinkedInAccessToken =
  "https://www.linkedin.com/oauth/v2/accessToken";
const urlToGetUserProfile =
  "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~digitalmediaAsset:playableStreams))";
const urlToGetUserEmail =
  "https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))";
const _ = require("underscore");
const { User } = require("../models/userSchema");
const { ContactUs } = require("../models/contactUsSchema");
const { Feedback } = require("../models/feedBackSchema");
const { Interest } = require("../models/interestSchema");
const {
  LearnWithBthrivePost,
} = require("../models/learnWithBthrivePostSchema");
const {
  joiSchema,
  validateUsingJoi,
} = require("../joiValidations/joiValidateUser");
const sendMail = require("../services/emailService");
const { Admin } = require("../models/adminSchema");
const { EventDetails } = require("../models/eventSchema");
const { ClassDetails } = require("../models/classSchema");
const { Post } = require("../models/postSchema");
const { Like } = require("../models/likeSchema");
const { Comment } = require("../models/commentSchema");
const { CollectionLike } = require("../models/collectionLikeSchema");
const { Collection } = require("../models/collectionSchema");
const { BecomeHost } = require("../models/hostSchema");
const { BookClubPost } = require("../models/bookClubPostsSchema");
const { BookClubData } = require("../models/bookClubDataSchema");

const createUserWithGoogle = async (req, res) => {
  const client_id = await config.get("googleClientId");

  const client = new OAuth2Client(client_id);
  const googleAuthentication = async (email) => {
    let user = await User.findOne({
      email: email.toLowerCase(),
    }).populate("details");
    //if(!user.registeredWithGoogle) return res.status(400).send({error: "Not Registered with Google"});
    if (user.status == "inactive") {
      return res.status(404).send({ error: "Profile is blocked by the Admin" });
    }
    const token = await user.generateAuthToken();
    user.loginTime = Date.now();
    user.isLoggedIn = true;
    user.numberOfLogins += 1;
    await user.save();
    return res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({
        registerationCompleted: user.isVerified && user.registerationStatus,
        profileType: user.profileType,
        message: "Logged in Successfully",
      });
  };

  const createGoogleUser = async (email, name, picture) => {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return googleAuthentication(email);
    user = new User({
      email: await email.toLowerCase(),
      name: name,
      isVerified: true,
      registeredWithGoogle: true,
      registerationStatus: true,
      accountCreationDate: Date.now(),
    });
    user.profilePicture = picture;
    user = await user.save();
    const token = await user.generateAuthToken();
    return res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({
        isregistered: true,
        profileType: user.profileType,
        user: user,
        message: "User Registered Successfully",
      });
  };
  const ticket = await client
    .verifyIdToken({
      idToken: req.body.tokenId,
      audience: config.get("googleClientId"),
    })
    .then((response) => {
      const { email_verified, email, name, picture } = response.payload;
      if (email_verified) createGoogleUser(email, name, picture);
    });
};
module.exports.createUserWithGoogle = createUserWithGoogle;

const createUserWithLinkedin = async (req, res) => {
  const config1 = {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  };
  const parameters = {
    grant_type: "authorization_code",
    code: req.body.code,
    redirect_uri: req.body.uri,
    client_id: config.get("linkedinClientId"),
    client_secret: config.get("linkedinClientSecret"),
  };
  let user_email = "";
  const linkedinAuthentication = async (email) => {
    if (!email) return res.status(400).send({ error: "Try Again" });
    let user = await User.findOne({
      email: email.toLowerCase(),
    }).populate("details");
    if (user.status == "inactive") {
      return res.status(404).send({ error: "Profile is blocked by the Admin" });
    }
    user.loginTime = Date.now();
    user.isLoggedIn = true;
    user.numberOfLogins += 1;
    user = await user.save();
    const token = await user.generateAuthToken();

    return res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({
        registerationCompleted: user.isVerified && user.registerationStatus,
        profileType: user.profileType,
        message: "Logged in Successfully",
      });
  };
  const updateNewUser = async (profile) => {
    if (!profile.email) return res.status(400).send({ error: "Try Again" });
    let user = await User.findOne({ email: profile.email.toLowerCase() });
    if (user) return linkedinAuthentication(profile.email);
    user = new User({
      email: await profile.email.toLowerCase(),
      registeredWithLinkedin: true,
      name: `${profile.firstName} ${profile.lastName}`,
      isVerified: true,
      registerationStatus: true,
      linkedinId: profile.id,
      accountCreationDate: Date.now(),
    });
    user.profilePicture = profile.profileImageURL;
    user = await user.save();
    const token = await user.generateAuthToken();
    return res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({
        isregistered: true,
        profileType: user.profileType,
        user: user,
        message: "User Registered Successfully",
      });
  };
  axios
    .post(urlToGetLinkedInAccessToken, qs.stringify(parameters), config1)
    .then((response) => {
      const config3 = {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
        },
      };
      axios
        .get(urlToGetUserEmail, config3)
        .then((response2) => {
          user_email = response2.data.elements[0]["handle~"].emailAddress;
          userProfile.email =
            response2.data.elements[0]["handle~"].emailAddress;
          //createNewUser(response2.data.elements[0]["handle~"].emailAddress);
        })
        .catch((error2) => console.log("Error getting user email"));
      let userProfile = {};
      const config2 = {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
        },
      };
      axios
        .get(urlToGetUserProfile, config2)
        .then((response1) => {
          userProfile.firstName = response1.data.localizedFirstName;
          userProfile.lastName = response1.data.localizedLastName;
          userProfile.id = response1.data.id;
          userProfile.profileImageURL =
            response1.data.profilePicture[
              "displayImage~"
            ].elements[0].identifiers[0].identifier;
          updateNewUser(userProfile);
        })
        .catch((error1) => console.log(error1));
    })
    .catch((err) => {
      console.log("Error getting LinkedIn access token");
    });
};
module.exports.createUserWithLinkedin = createUserWithLinkedin;

const createPrimaryUser = async (req, res) => {
  //joi schema
  const schema = {
    email: joiSchema.email,
    password: joiSchema.password,
  };

  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: await req.body.email.toLowerCase() });
  if (user)
    return res
      .status(404)
      .send({ error: "User already registered kindly login " });
  const salt = await bcrypt.genSalt(5);
  req.body.password = await bcrypt.hash(req.body.password, salt);
  user = new User({
    email: await req.body.email.toLowerCase(),
    password: req.body.password,
    profileType: "user",
    status: "active",
    accountCreationDate: Date.now(),
  });
  await user.save();
  return res.send({
    _id: user._id,
    email: user.email,
    message: "User Registered Successfully ",
  });
};
module.exports.createPrimaryUser = createPrimaryUser;

const createAdmin = async (req, res) => {
  const salt = await bcrypt.genSalt(5);
  req.query.password = await bcrypt.hash(req.query.password, salt);
  user = new Admin({
    email: await req.query.email.toLowerCase(),
    name: req.query.name,
    password: req.query.password,
    profilePicture: req.files[0].location,
    isAdmin: true,
  });
  await user.save();
  return res.send({
    _id: user._id,
    email: user.email,
    message: "Admin Registered Successfully ",
  });
};
module.exports.createAdmin = createAdmin;

const createInterest = async (req, res) => {
  interest = new Interest({
    name: req.body.name,
    profilePicture: req.files[0].location,
  });
  await interest.save();
  return res.send({
    _id: interest._id,
    message: "Interest Successfully Made",
  });
};
module.exports.createInterest = createInterest;

const userAuthentication = async (req, res) => {
  const schema = {
    email: joiSchema.email,
    password: joiSchema.password,
  };

  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send({ error: error.details[0].message });

  let user = await User.findOne({
    email: await req.body.email.toLowerCase(),
  }).populate("details");
  if (!user)
    return res.status(400).send({ error: "Invalid Email or Password" });
  if (user.registeredWithGoogle)
    return res.status(404).send({ error: "Registered with Google" });
  if (user.registeredWithLinkedin)
    return res.status(404).send({ error: "Registered with Linkedin" });
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send({ error: "Invalid Email or Password" });

  if (!user.isVerified)
    return res.status(200).send({
      registerationCompleted: false,
      isVerified: false,
      profileType: user.profileType,
      message: "Kindy Complete Registeration Process",
    });
  if (!user.registerationStatus) {
    const token = await user.generateAuthToken();
    return res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({
        registerationCompleted: false,
        isVerified: user.isVerified,
        isRegistered: user.registerationStatus,
        profileType: user.profileType,
        message: "Kindy Complete Registeration Process",
      });
  }

  if (user.status == "inactive") {
    return res.status(404).send({ error: "Profile is blocked by the Admin" });
  }
  const token = await user.generateAuthToken();
  user.loginTime = Date.now();
  user.isLoggedIn = true;
  user.numberOfLogins += 1;
  await user.save();
  return res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send({
      registerationCompleted: user.isVerified && user.registerationStatus,
      isFirst: user.isFirst,
      profileType: user.profileType,
      message: "Logged in Successfully",
    });
};
module.exports.userAuthentication = userAuthentication;

const otpGeneration = async (req, res) => {
  const schema = {
    email: joiSchema.email,
  };

  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send({ error: error.details[0].message });

  let user = await User.findOne({ email: await req.body.email.toLowerCase() });
  if (!user) {
    return res.status(404).send({ error: "User Not Registered" });
  }
  if (!user.name) user.isVerified = false;
  if (user.registeredWithGoogle)
    return res.status(404).send({ error: "Registered with Google" });
  if (user.registeredWithLinkedin)
    return res.status(404).send({ error: "Registered with Linkedin" });
  let otpGenerated = Math.floor(1000 + Math.random() * 9000);

  const salt = await bcrypt.genSalt(5);
  const hashedOtp = await bcrypt.hash(otpGenerated.toString(), salt);

  user.otp = hashedOtp;

  user = await user.save();

  await sendMail(
    await req.body.email.toLowerCase(),
    "Otp for User Verification",
    `Your Otp for User Verification is ${otpGenerated}`
  );
  return res
    .status(200)
    .send({ message: "Otp sent on your email for verification" });
};

module.exports.otpGeneration = otpGeneration;

const otpVerification = async (req, res) => {
  const schema = {
    email: joiSchema.email,
    otp: joiSchema.otp,
  };

  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send({ error: error.details[0].message });

  var user = await User.findOne({ email: await req.body.email.toLowerCase() });

  if (user) {
    if (!user.name) user.isVerified = false;
    if (user.registeredWithGoogle)
      return res.status(404).send({ error: "Registered with Google" });
    if (user.registeredWithLinkedin)
      return res.status(404).send({ error: "Registered with Linkedin" });
    const validOtp = await bcrypt.compare(req.body.otp, user.otp);
    if (validOtp) {
      if (!user.name) user.isVerified = true;
      user = await user.save();
      const token = user.generateAuthToken();
      return res
        .header("x-auth-token", token)
        .header("access-control-expose-headers", "x-auth-token")
        .send({
          isregistered: user.registerationStatus,
          profileType: user.profileType,
          message: "User Verified Successfully",
        });
    } else return res.status(400).send({ error: "Otp Mismatch" });
  } else
    return res.status(400).send({ error: "You are not a Registered User" });
};
module.exports.otpVerification = otpVerification;

const resetPassword = async (req, res) => {
  //joi schema
  const schema = {
    password: joiSchema.password,
  };

  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send({ error: error.details[0].message });

  let user = await User.findById(req.user._id);
  if (!user) return res.status(404).send({ error: "User Not Registered" });

  if (!user.isVerified)
    return res.status(404).send({ error: "User is Not Verified Yet" });

  const salt = await bcrypt.genSalt(5);
  req.body.password = await bcrypt.hash(req.body.password, salt);
  user.password = req.body.password;
  await user.save();
  const token = user.generateAuthToken();
  return res.header("x-auth-token", token).send({
    profileType: user.profileType,
    message: "Password Reset Successful",
  });
};
module.exports.resetPassword = resetPassword;

const registeration = async (req, res) => {
  res.send({ message: "Registered Successfully" });
};

module.exports.registeration = registeration;

const setUpProfile = async (req, res) => {
  // const schema = {
  //     profilePicture: joiSchema.profilePicture,

  // };
  // //input validation
  // const { error } = validateUsingJoi(req.body, schema);
  // if (error) return res.status(400).send(error.details[0].message);
  let user = await User.findById(req.user._id);
  if (!user) return res.status(404).send({ error: "User Not Registered" });

  if (user.isVerified === false) {
    res.status(404).send({ error: "User is Not Verified" });
  }

  user.name = req.body.name;
  user.location = req.body.location;
  user.origin = req.body.origin;
  user.isBlogger = req.body.isBlogger;
  user.blogLink = req.body.blogLink;
  user.profilePicture = req.files[0].location;
  user.registerationStatus = true;
  await user.save();

  return res.send({
    profileType: user.profileType,
    message: `${user.profileType} Registered Successfully`,
  });
};

module.exports.setUpProfile = setUpProfile;

const saveInterest = async (req, res) => {
  let user = await User.findById(req.user._id);
  var interests = req.body.interest;
  for (i = 0; i < req.body.interest.length; i++) {
    if (!user.interest.includes(interests[i]._id)) {
      user.interest.push(interests[i]);
      await user.save();
    }
  }

  return res.send({
    id: user._id,
    message: "Interest Saved Successfully",
  });
};

module.exports.saveInterest = saveInterest;

const tokenCheck = async (req, res) => {
  res.send({ message: "Token Verifired" });
};

module.exports.tokenCheck = tokenCheck;

const changePassword = async (req, res) => {
  //joi schema
  const schema = {
    oldPassword: joiSchema.password,
    newPassword: joiSchema.newPassword,
    confirmNewPassword: joiSchema.newPassword,
  };
  //input validation
  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send({ error: error.details[0].message });

  if (req.body.newPassword !== req.body.confirmNewPassword)
    return res.status(400).send({ error: "Password Mismatch" });

  //check whether user registered or not
  let user;
  if (!req.user.isAdmin) {
    user = await User.findById(req.user._id);
    if (!user) return res.status(404).send({ error: "User Not Registered" });
  } else {
    user = await Admin.findById(req.user._id);
    if (!user) return res.status(404).send({ error: "User Not Registered" });
  }

  //check whether old password is valid or not
  const validPassword = await bcrypt.compare(
    req.body.oldPassword,
    user.password
  );
  if (!validPassword)
    return res.status(400).send({ error: "Invalid Old Password" });

  //update password
  const salt = await bcrypt.genSalt(5);
  req.body.newPassword = await bcrypt.hash(req.body.newPassword, salt);
  user.password = req.body.newPassword;
  await user.save();
  return res.send({
    message: "Password Changed Successfully",
  });
};
module.exports.changePassword = changePassword;

const myData = async (req, res) => {
  let user = await User.findById(req.user._id).populate("interest");
  let checkUser = await User.aggregate([
    {
      $match: { _id: user._id },
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "createdBy",
        as: "postList",
      },
    },
    {
      $lookup: {
        from: "collections",
        localField: "_id",
        foreignField: "createdBy",
        as: "collectionList",
      },
    },
    {
      $addFields: {
        total_posts: {
          $size: {
            $filter: {
              input: "$postList",
              as: "mi",
              cond: {
                $eq: ["$$mi.type", "post"],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        total_collections: {
          $size: {
            $filter: {
              input: "$collectionList",
              as: "mi",
              cond: {},
            },
          },
        },
      },
    },
  ]);
  checkUser[0].total_bookmarks = checkUser[0].postsBookmarked.length;
  if (!user) return res.status(404).send({ error: "User Not Registered" });

  if (user.isVerified === false) {
    return res.status(404).send({ error: "User is Not Verified" });
  }

  if (!user.registerationStatus)
    return res
      .status(404)
      .send({ error: "Registration Process is Incomplete" });

  return res.send({
    user: user,
    checkUser: checkUser,
    profileType: user.profileType,
    message: `Welcome ${user.name}`,
  });
};

module.exports.myData = myData;

const getInterest = async (req, res) => {
  let user = await Interest.find({});
  return res.send({
    interests: user,
    message: `Interests Fetched Successfully`,
  });
};

module.exports.getInterest = getInterest;

const myInterest = async (req, res) => {
  let user = await User.find({
    _id: req.user._id,
  }).populate("interest");
  return res.send({
    interests: user[0].interest,
    message: `Interests Fetched Successfully`,
  });
};

module.exports.myInterest = myInterest;

const trendingInterest = async (req, res) => {
  let user = await Interest.aggregate([
    {
      $match: {},
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "interest",
        as: "postList",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "interest",
        as: "userList",
      },
    },

    {
      $addFields: {
        total_posts: {
          $size: {
            $filter: {
              input: "$postList",
              as: "mi",
              cond: {},
            },
          },
        },
      },
    },
    {
      $addFields: {
        total_users: {
          $size: {
            $filter: {
              input: "$userList",
              as: "mi",
              cond: {},
            },
          },
        },
      },
    },
    { $sort: { total_posts: -1 } },
  ]);
  return res.send({
    interests: user,
    message: `Interests Fetched Successfully`,
  });
};

module.exports.trendingInterest = trendingInterest;

const editProfile = async (req, res) => {
  let user = await User.findById(req.user._id).populate("interest");
  if (!user) return res.status(404).send({ error: "User Not Registered" });

  if (user.isVerified === false) {
    res.status(404).send({ error: "User is Not Verified" });
  }

  //edit details
  user.name = req.body.name;
  user.email = req.body.email;
  user.website = req.body.website;
  user.description = req.body.description;
  if (req.files.length > 0) {
    user.profilePicture = req.files[0].location;
  }

  User.updateOne({ _id: req.user._id }, { $unset: { interest: 1 } });
  const interests = JSON.parse(req.body.interests);

  let pluckedInterest = _.pluck(interests, "_id");

  user.interest = pluckedInterest;

  await user.save();

  return res.send({ message: "Profile Updated Successfully" });
};

module.exports.editProfile = editProfile;

const contactUs = async (req, res) => {
  let contactus = new ContactUs({
    name: req.body.name,
    email: await req.body.email.toLowerCase(),
    message: req.body.message,
    creationDate: Date.now(),
  });
  await contactus.save();
  await sendMail(
    "contact@b-thrivecommunity.com",
    "Contact Support for B-thrive",
    `${req.body.name}'s Message : -\n ${req.body.message}`
  );
  return res.send({
    _id: contactus._id,
    email: contactus.email,
    message: "Query Submitted Successfully",
  });
};
module.exports.contactUs = contactUs;

const feedback = async (req, res) => {
  let feedback = new Feedback({
    message: req.body.message,
    user: req.user._id,
    creationDate: Date.now(),
  });
  await feedback.save();
  return res.send({
    message: "Query Submitted Successfully",
  });
};
module.exports.feedback = feedback;

const getEvents = async (req, res) => {
  let user = await User.findById(req.user._id);
  if (!user) return res.status(404).send({ error: "Bad Request" });

  if (req.query.sort || req.query.sort != "All_Time") time = Date.now();
  if (req.query.sort == "last_minute") time = 1 * 60 * 1000;
  if (req.query.sort == "last_hour") time = 60 * 60 * 1000;
  if (req.query.sort == "last_week") time = 7 * 24 * 60 * 60 * 1000;
  if (req.query.sort == "last_month") time = 30 * 24 * 60 * 60 * 1000;
  if (req.query.sort == "last_quarter") time = 90 * 24 * 60 * 60 * 1000;
  if (req.query.sort == "last_year") time = 365 * 24 * 60 * 60 * 1000;

  let events;
  if (req.query.type == "past")
    events = await EventDetails.find({ date: { $lt: Date.now() } }).lean();
  else if (req.query.type == "upcoming")
    events = await EventDetails.find({ date: { $gt: Date.now() } }).lean();
  else if (req.query.search)
    events = await EventDetails.find({
      name: { $regex: req.query.search, $options: "i" },
    }).lean();
  else
    events = await EventDetails.find({
      creationDate: { $gt: new Date(Date.now() - time) },
    }).lean();
  for (const event of events) {
    event.type = "Event";
    let host = await User.find({ email: event.host_email }).select({
      name: 1,
      profilePicture: 1,
      email: 1,
    });

    event.host_email = host[0];
  }
  res.send({ events });
};
module.exports.getEvents = getEvents;

const getClasses = async (req, res) => {
  let user = await User.findById(req.user._id);

  if (!user) return res.status(404).send({ error: "Bad Request" });
  if (req.query.sort || req.query.sort != "All_Time") time = Date.now();
  if (req.query.sort == "last_minute") time = 1 * 60 * 1000;
  if (req.query.sort == "last_hour") time = 60 * 60 * 1000;
  if (req.query.sort == "last_week") time = 7 * 24 * 60 * 60 * 1000;
  if (req.query.sort == "last_month") time = 30 * 24 * 60 * 60 * 1000;
  if (req.query.sort == "last_quarter") time = 90 * 24 * 60 * 60 * 1000;
  if (req.query.sort == "last_year") time = 365 * 24 * 60 * 60 * 1000;

  let classes;
  if (req.query.type == "past")
    classes = await ClassDetails.find({ date: { $lt: Date.now() } }).lean();
  else if (req.query.type == "upcoming")
    classes = await ClassDetails.find({ date: { $gt: Date.now() } }).lean();
  else if (req.query.search)
    classes = await ClassDetails.find({
      name: { $regex: req.query.search, $options: "i" },
    }).lean();
  else
    classes = await ClassDetails.find({
      creationDate: { $gt: new Date(Date.now() - time) },
    }).lean();
  for (const c of classes) {
    c.type = "Class";
    let host = await User.find({ email: c.host_email }).select({
      name: 1,
      profilePicture: 1,
      email: 1,
    });
    c.host_email = host[0];
  }
  res.send({ classes });
};
module.exports.getClasses = getClasses;

const deleteInterest = async (req, res) => {
  let user = await Interest.findById(req.params.id);

  await user.delete();
  const users = await User.find({ interest: { $ne: [] } });
  for (const u of users)
    if (u.interest.includes(req.params.id)) {
      u.interest.splice(u.interest.indexOf(req.params.id), 1);
      u.save();
    }
  const posts = await Post.find({ interest: { $ne: [] } });
  for (const p of posts)
    if (p.interest.includes(req.params.id)) {
      p.interest.splice(p.interest.indexOf(req.params.id), 1);
      p.save();
    }

  return res.send({ message: "Interest Deleted Successfully" });
};

module.exports.deleteInterest = deleteInterest;

const addInterestInUser = async (req, res) => {
  let user = await User.findById(req.user._id);
  if (!user.interest.includes(req.params.id)) {
    user.interest.push(req.params.id);
  } else return res.status(400).send({ error: "Interest Already Added" });

  await user.save();

  return res.send({
    interest: user.interest,
    message: "Interest Added Successfully",
  });
};

module.exports.addInterestInUser = addInterestInUser;

const deleteInterestInUser = async (req, res) => {
  let user = await User.findById(req.user._id);

  const index = user.interest.indexOf(req.params.id);
  if (index > -1) {
    user.interest.splice(index, 1);
  }

  await user.save();

  return res.send({
    interest: user.interest,
    message: "Interest Deleted Successfully",
  });
};

module.exports.deleteInterestInUser = deleteInterestInUser;

const bloggerData = async (req, res) => {
  const collaboratedBloggers = await User.find({
    isCollaborated: true,
    isBlogger: true,
    _id: { $nin: req.user.usersBlocked },
    isDeactivated: false,
  })
    .select({
      name: 1,
      profilePicture: 1,
      description: 1,
      location: 1,
      profilePicture: 1,
      usersBlocked: 1,
    })
    .lean();
  for (const blogger of collaboratedBloggers) {
    const noOfPosts = await Post.find({
      createdBy: blogger._id,
      type: "post",
    }).count();
    blogger.numberOfPosts = noOfPosts;
  }

  return res.send({
    collaboratedBloggers: collaboratedBloggers,
  });
};
module.exports.bloggerData = bloggerData;

const bloggersProfileData = async (req, res) => {
  if (req.user.usersBlocked.includes(req.params.id))
    return res.send({
      message: "Unable to Open",
    });
  a = User.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(req.params.id) },
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "createdBy",
        as: "usersposts",
      },
    },
    {
      $lookup: {
        from: "collections",
        localField: "_id",
        foreignField: "createdBy",
        as: "userscollections",
      },
    },
    {
      $lookup: {
        from: "blog",
        localField: "_id",
        foreignField: "createdBy",
        as: "usersblog",
      },
    },
    {
      $addFields: {
        total_posts: {
          $size: {
            $filter: {
              input: "$usersposts",
              as: "mi",
              cond: {
                $eq: ["$$mi.type", "post"],
              },
            },
          },
        },
        total_collections: {
          $size: {
            $filter: {
              input: "$userscollections",
              cond: {},
            },
          },
        },
      },
    },
  ]).exec(async function (err, transactions) {
    if (err) throw err;

    return res.send({
      usersData: transactions,
    });
  });
};
module.exports.bloggersProfileData = bloggersProfileData;

const logout = async (req, res) => {
  let user = await User.findById(req.user._id);
  const minutes = parseInt(Math.abs(Date.now() - user.loginTime) / (1000 * 60));
  const days = parseInt(
    Math.abs(user.accountCreationDate - Date.now()) / (1000 * 60 * 60 * 24)
  );
  user.isLoggedIn = false;
  if (days != 0) user.averageTimeSpent += Math.round(minutes / days);
  else user.averageTimeSpent += minutes;
  await user.save();
  return res.send({
    message: "Logged Out Successfully",
  });
};

module.exports.logout = logout;

const deactivate = async (req, res) => {
  let user = await User.findById(req.user._id);
  user.isDeactivated = true;
  await user.save();
  let posts = await Post.find({ createdBy: req.user._id });
  let collections = await Collection.find({ createdBy: req.user._id });
  let likes = await Like.find({ createdBy: req.user._id });
  let comments = await Comment.find({ createdBy: req.user._id });
  let clikes = await CollectionLike.find({ createdBy: req.user._id });
  let bookclubs = await BookClubPost.find({ createdBy: req.user._id });
  for (const post of posts) {
    post.status = "inactive";
    await post.save();
  }
  for (const collection of collections) {
    collection.status = "inactive";
    await collection.save();
  }
  for (const like of likes) {
    like.status = "inactive";
    await like.save();
  }
  for (const comment of comments) {
    comment.status = "inactive";
    await comment.save();
  }
  for (const clike of clikes) {
    clike.status = "inactive";
    await clike.save();
  }
  for (const bookclub of bookclubs) {
    bookclub.status = "inactive";
    await bookclub.save();
  }

  return res.send({
    message: "Account Deactivated Successfully",
  });
};

module.exports.deactivate = deactivate;

const notification = async (req, res) => {
  let notification = [];
  let count = 0;
  let posts = await Post.find({ createdBy: req.user._id }).select({ type: 1 });
  let bookClubPosts = await BookClubPost.find({
    createdBy: req.user._id,
  }).select({ type: 1, model: 1 });
  for (let a of posts) {
    let likes = await Like.find({
      postId: a._id,
      status: "active",
      createdBy: { $ne: req.user._id },
    })
      .select({ creationDate: 1, type: 1, createdBy: 1, isRead: 1 })
      .lean();
    if (likes.length != 0) {
      for (const like of likes) {
        like.postId = a._id;
        like.postType = a.type;
        like.createdBy = await User.findById(like.createdBy).select({
          name: 1,
          profilePicture: 1,
          isBlogger: 1,
        });
        notification.push(like);
      }
    }
  }
  for (let a of posts) {
    let comments = await Comment.find({
      postId: a._id,
      status: "active",
      createdBy: { $ne: req.user._id },
    })
      .select({ creationDate: 1, type: 1, createdBy: 1, isRead: 1 })
      .lean();
    if (comments.length != 0) {
      for (const comment of comments) {
        comment.postId = a._id;
        comment.postType = a.type;
        comment.createdBy = await User.findById(comment.createdBy).select({
          name: 1,
          profilePicture: 1,
          isBlogger: 1,
        });
        notification.push(comment);
      }
    }
  }
  for (let a of bookClubPosts) {
    let likes = await Like.find({
      postId: a._id,
      status: "active",
      createdBy: { $ne: req.user._id },
    })
      .select({ creationDate: 1, type: 1, createdBy: 1, isRead: 1 })
      .lean();
    if (likes.length != 0) {
      for (const like of likes) {
        like.postId = a._id;
        like.postType = a.type;
        like.model = a.model;
        like.createdBy = await User.findById(like.createdBy).select({
          name: 1,
          profilePicture: 1,
          isBlogger: 1,
        });
        notification.push(like);
      }
    }
  }
  for (let a of bookClubPosts) {
    let comments = await Comment.find({
      postId: a._id,
      status: "active",
      createdBy: { $ne: req.user._id },
    })
      .select({ creationDate: 1, type: 1, createdBy: 1, isRead: 1 })
      .lean();
    if (comments.length != 0) {
      for (const comment of comments) {
        comment.postId = a._id;
        comment.postType = a.type;
        comment.model = a.model;
        comment.createdBy = await User.findById(comment.createdBy).select({
          name: 1,
          profilePicture: 1,
          isBlogger: 1,
        });
        notification.push(comment);
      }
    }
  }
  let collections = await Collection.find({ createdBy: req.user._id }).select({
    _id: 1,
  });
  for (let a of collections) {
    let clikes = await CollectionLike.find({
      collectionId: a._id,
      status: "active",
      createdBy: { $ne: req.user._id },
    })
      .select({ creationDate: 1, createdBy: 1, isRead: 1 })
      .lean();
    if (clikes.length != 0) {
      for (const clike of clikes) {
        clike.postId = a._id;
        clike.postType = "collection";
        clike.type = null;
        clike.createdBy = await User.findById(clike.createdBy).select({
          name: 1,
          profilePicture: 1,
          isBlogger: 1,
        });
        notification.push(clike);
      }
    }
  }
  if (req.user.usersBlocked.length) {
    for (var i = 0; i < notification.length; i++) {
      if (notification[i].createdBy.usersBlocked)
        if (
          req.user.usersBlocked.includes(notification[i].createdBy._id) ||
          notification[i].createdBy.usersBlocked.includes(req.user._id)
        ) {
          notification.splice(i, 1);
          i--;
        }
    }
  }
  notification.sort((a, b) =>
    a.creationDate > b.creationDate
      ? 1
      : b.creationDate > a.creationDate
      ? -1
      : 0
  );
  for (const n of notification) if (!n.isRead) count++;
  res.send({
    notification: notification.reverse(),
    count: count,
  });
};
module.exports.notification = notification;

const readNotification = async (req, res) => {
  let notify;
  if (req.query.type == "like") notify = await Like.findById(req.params.id);
  else if (req.query.type == "clike")
    notify = await CollectionLike.findById(req.params.id);
  else if (req.query.type == "comment")
    notify = await Comment.findById(req.params.id);
  notify.isRead = true;
  await notify.save();
  return res.send({
    message: "Read Successfully",
  });
};

module.exports.readNotification = readNotification;

const attendEventOrClass = async (req, res) => {
  let event;
  if (req.params.type == "event")
    event = await EventDetails.findById(req.params.id);
  else event = await ClassDetails.findById(req.params.id);
  if (event.attendees.includes(req.user._id))
    return res.send({
      message: `${req.params.type} Already Registered`,
    });
  else {
    event.attendees.push(req.user._id);
    await event.save();
  }
  return res.send({
    message: `${req.params.type} Registered Successfully`,
  });
};

module.exports.attendEventOrClass = attendEventOrClass;

const becomeAHost = async (req, res) => {
  date = new Date(req.body.date);
  host = new BecomeHost({
    date: req.body.date,
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    idea: req.body.idea,
    host: req.user._id,
    creationDate: Date.now(),
    coverImage: req.files[0].location,
  });
  await host.save();
  return res.send({
    message: "Request Successful",
  });
};

module.exports.becomeAHost = becomeAHost;

const getHost = async (req, res) => {
  const today = new Date();
  const hostData = await BecomeHost.find({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    isApproved: true,
  }).lean();
  if (hostData[0]) {
    user = await User.findById(hostData[0].host).select({
      name: 1,
      profilePicture: 1,
      isBlogger: 1,
    });
    hostData[0].host_data = user;
  }
  return res.send({
    host: hostData[0],
  });
};

module.exports.getHost = getHost;

const followBookClub = async (req, res) => {
  const user = await User.findById(req.params.id);
  user.followedBookClub = !user.followedBookClub;
  await user.save();
  return res.send({
    message: user.followedBookClub
      ? "Followed Book Club"
      : "Unfollowed Book Club",
  });
};

module.exports.followBookClub = followBookClub;

const UserPanellearnWithBthrivePostList = async (req, res) => {
  list = await LearnWithBthrivePost.find({
    status: "active",
    type: req.params.type == "post" ? "post" : "question",
  })
    .sort({ creationDate: -1 })
    .populate(["interest", "createdBy"]);

  a = LearnWithBthrivePost.aggregate([
    {
      $match: {
        $and: [
          req.query.id ? { _id: mongoose.Types.ObjectId(req.query.id) } : {},
          req.query.collectionId ? { _id: { $in: collectionList.post } } : {},
          { status: "active" },
          req.query.search
            ? { description: { $regex: req.query.search, $options: "i" } }
            : {},
          req.query.type
            ? { createdBy: mongoose.Types.ObjectId(req.user._id) }
            : {},
          { type: req.params.type == "post" ? "post" : "question" },
          req.query.interestId
            ? {
                interest: {
                  $in: [mongoose.Types.ObjectId(req.query.interestId)],
                },
              }
            : {},
        ],
      },
    },
    { $sort: { creationDate: -1 } },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "postId",
        as: "commentList",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "postId",
        as: "likeList",
      },
    },
    {
      $addFields: {
        total_likes: {
          $size: {
            $filter: {
              input: "$likeList",
              as: "mi",
              cond: {},
            },
          },
        },
        total_likes_1: {
          $size: {
            $filter: {
              input: "$likeList",
              as: "mi",
              cond: {
                $eq: ["$type", "6"],
              },
            },
          },
        },
        total_comments: {
          $size: {
            $filter: {
              input: "$commentList",
              as: "commentList",
              cond: { $eq: ["$$commentList.type", "comment"] },
            },
          },
        },
        total_insights: {
          $size: {
            $filter: {
              input: "$commentList",
              as: "commentList",
              cond: {
                $and: [
                  { $eq: ["$$commentList.type", "insight"] },
                  { $eq: ["$$commentList.showStatus", "approved"] },
                  // { "$in": [ "$_id", "$$lastViewed.members.groupId" ] }
                ],
              },
            },
          },
        },
        my_like: {
          $filter: {
            input: "$likeList",
            as: "mi",
            cond: {
              $in: [
                mongoose.Types.ObjectId(req.user._id),
                "$likeList.createdBy",
              ],
            },
            // "cond":{ $eq: ["$likeList.createdBy", req.user._id] },
          },
        },
      },
    },
    {
      $facet: {
        metadata: [
          { $count: "total" },
          { $addFields: { page: req.query.page } },
        ],
        data: [
          // { $skip: req.query.page == 1 ? 0 : (req.query.page - 1) * 3 },
          // { $limit: 3 },
        ], // add projection here wish you re-shape the docs
      },
    },
  ]).exec(function (err, transactions) {
    if (err) throw err;
    Admin.populate(
      transactions[0].data,
      { path: "createdBy" },
      function (err, populatedTransactions) {
        User.populate(
          populatedTransactions,
          { path: "likeList.createdBy" },
          function (err, populatedTransactions2) {
            Interest.populate(
              populatedTransactions,
              { path: "interest" },
              function (err, populatedTransactions1) {
                return res.send({
                  postList: transactions,
                });
              }
            );
          }
        );
      }
    );
  });
};

module.exports.UserPanellearnWithBthrivePostList =
  UserPanellearnWithBthrivePostList;

const getStart = async (req, res) => {
  await sendMail(
    "contact@b-thrivecommunity.com",
    "Contact Support for B-thrive",
    `Hello Bthrive Team,-\n ${req.body.email} wants to get started with Bthrive`
  );
  return res.send({
    email: req.body.email,
    message: "Mail Sent Successfully",
  });
};
module.exports.getStart = getStart;

const getBookClubData = async (req, res) => {
  const data = await BookClubData.find();
  return res.send({
    data: data,
  });
};

module.exports.getBookClubData = getBookClubData;
