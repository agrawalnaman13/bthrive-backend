const { User } = require("../models/userSchema");
const { Post } = require("../models/postSchema");
const { EventDetails } = require("../models/eventSchema");
const { ClassDetails } = require("../models/classSchema");
const { Interest } = require("../models/interestSchema.js");
const { ContactUs } = require("../models/contactUsSchema");
const { Like } = require("../models/likeSchema");
const { Comment } = require("../models/commentSchema");
const { CollectionLike } = require("../models/collectionLikeSchema");
const { Collection } = require("../models/collectionSchema");
const { Report } = require("../models/reportSchema");
const sendMail = require("../services/emailService");
const {
  joiSchema,
  validateUsingJoi,
} = require("../joiValidations/joiValidateUser");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const { Admin } = require("../models/adminSchema");
const mongoose = require("mongoose");
const {
  LearnWithBthrivePost,
} = require("../models/learnWithBthrivePostSchema");
const { Feedback } = require("../models/feedBackSchema");
const { BecomeHost } = require("../models/hostSchema");
const { Blog } = require("../models/blogSchema");
const { BookClubPost } = require("../models/bookClubPostsSchema");
const { BookClubData } = require("../models/bookClubDataSchema");

const adminAuthentication = async (req, res) => {
  const schema = {
    email: joiSchema.email,
    password: joiSchema.password,
  };
  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send({ error: error.details[0].message });
  let user = await Admin.findOne({ email: await req.body.email.toLowerCase() });
  if (!user)
    return res.status(400).send({ error: "Invalid Email or Password" });
  if (!user.isAdmin) return res.status(404).send({ error: "Bad Request" });
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send({ error: "Invalid Email or Password" });
  const token = await user.generateAuthToken();
  return res
    .header("x-auth-token-admin", token)
    .header("access-control-expose-headers", "x-auth-token-admin")
    .send({
      profileType: user.profileType,
      message: "Logged in Successfully",
    });
};
module.exports.adminAuthentication = adminAuthentication;

const adminOtpGeneration = async (req, res) => {
  const schema = {
    email: joiSchema.email,
  };
  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send({ error: error.details[0].message });
  const user = await Admin.findOne({
    email: await req.body.email.toLowerCase(),
  });
  if (!user) {
    return res.status(404).send({ error: "Admin Not Registered" });
  }
  let otpGenerated = Math.floor(1000 + Math.random() * 9000);
  const salt = await bcrypt.genSalt(5);
  const hashedOtp = await bcrypt.hash(otpGenerated.toString(), salt);
  user.otp = hashedOtp;
  await user.save();

  await sendMail(
    await req.body.email.toLowerCase(),
    "Otp for User Verification",
    `Your Otp for User Verification is ${otpGenerated}`
  );
  return res
    .status(200)
    .send({ message: "Otp sent on your email for verification" });
};

module.exports.adminOtpGeneration = adminOtpGeneration;

const adminOtpVerification = async (req, res) => {
  const schema = {
    email: joiSchema.email,
    otp: joiSchema.otp,
  };
  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send({ error: error.details[0].message });
  const user = await Admin.findOne({
    email: await req.body.email.toLowerCase(),
  });

  if (user) {
    const validOtp = await bcrypt.compare(req.body.otp, user.otp);
    if (validOtp) {
      await user.save();
      return res.send({
        message: "Admin Verified Successfully",
      });
    } else return res.status(400).send({ error: "Otp Mismatch" });
  } else
    return res.status(400).send({ error: "You are not a Registered User" });
};
module.exports.adminOtpVerification = adminOtpVerification;

const adminResetPassword = async (req, res) => {
  //joi schema
  const schema = {
    email: joiSchema.email,
    password: joiSchema.password,
  };

  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send({ error: error.details[0].message });
  const user = await Admin.findOne({
    email: await req.body.email.toLowerCase(),
  });
  if (!user) return res.status(404).send({ error: "Admin Not Registered" });
  const salt = await bcrypt.genSalt(5);
  req.body.password = await bcrypt.hash(req.body.password, salt);
  user.password = req.body.password;
  await user.save();
  return res.send({
    message: "Password Reset Successful",
  });
};
module.exports.adminResetPassword = adminResetPassword;

const getAdmin = async (req, res) => {
  const admin = await Admin.findById(req.user._id);
  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });
  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }
  return res.send({
    admin: admin,
  });
};
module.exports.getAdmin = getAdmin;

const usersData = async (req, res) => {
  let admin = await Admin.findById(req.user._id);
  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });
  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }
  if (req.query.sort) {
    if (req.query.sort == "last_minute") {
      time = 1 * 60 * 1000;
    } else if (req.query.sort == "last_hour") {
      time = 60 * 60 * 1000;
    } else if (req.query.sort == "last_week") {
      time = 7 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_month") {
      time = 30 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_quarter") {
      time = 90 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_year") {
      time = 365 * 24 * 60 * 60 * 1000;
    }
  }

  a = User.aggregate([
    {
      $match: {
        $and: [
          { isBlogger: req.query.type === "blogger" ? true : false },
          req.query.sort && req.query.sort !== "All_Time"
            ? { accountCreationDate: { $gt: new Date(Date.now() - time) } }
            : {},
          { isVerified: true },
          { registerationStatus: true },
        ],
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "createdBy",
        as: "commentList",
      },
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
              cond: {},
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
        total_collections: {
          $size: {
            $filter: {
              input: "$collectionList",
              as: "collectionList",
              cond: {},
            },
          },
        },
      },
    },
    { $sort: { accountCreationDate: -1 } },
  ]).exec(function (err, transactions) {
    if (err) throw err;
    return res.send({
      usersData: transactions,
    });
  });
};
module.exports.usersData = usersData;

const userBlock = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }

  let user = await User.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  });

  if (user.status == "active") {
    change = "inactive";
  } else {
    change = "active";
  }
  var myquery = {
    _id: req.params.id,
  };
  var newvalues = { $set: { status: change } };
  User.updateOne(myquery, newvalues, function (err, res) {
    if (err) throw err;
  });
  return res.send({
    message: "Status Changed Successfully",
  });
};
module.exports.userBlock = userBlock;

const createEventOrClass = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }

  if (req.body.type === "event") {
    const event = new EventDetails({
      name: req.body.name,
      event_name: req.body.event_name,
      host_email: req.body.host_email,
      date: req.body.date,
      time: req.body.time,
      imagePath: req.files[0].location,
      creationDate: Date.now(),
    });
    await event.save();
  } else if (req.body.type === "class") {
    const classRoom = new ClassDetails({
      name: req.body.name,
      event_name: req.body.event_name,
      host_email: req.body.host_email,
      date: req.body.date,
      time: req.body.time,
      imagePath: req.files[0].location,
      creationDate: Date.now(),
    });
    await classRoom.save();
  }
  return res.send({
    message: `${req.body.type} registered successfully`,
  });
};
module.exports.createEventOrClass = createEventOrClass;

const createLearnWithBthrivePost = async (req, res) => {
  post = new LearnWithBthrivePost({
    description: req.body.description,
    web_link: req.body.web_link,
    link: req.body.link,
    status: "active",
    type: req.body.type == "question" ? "question" : "post",
    createdBy: req.user._id,
    creationDate: Date.now(),
  });
  await post.save();

  let createdPost = await LearnWithBthrivePost.findById(post._id);
  var images = req.files;
  for (i = 0; i < req.files.length; i++) {
    if (images[i].mimetype.startsWith("video")) {
      createdPost.videos.push(images[i].location);
      await createdPost.save();
    } else {
      createdPost.images.push(images[i].location);
      await createdPost.save();
    }
  }

  if (req.body.interest) {
    let isArray = Array.isArray(req.body.interest);
    if (isArray) {
      for (i = 0; i < req.body.interest.length; i++) {
        let findInterest = await Interest.findOne({
          name: req.body.interest[i],
        });
        createdPost.interest.push(findInterest._id);
        await createdPost.save();
      }
    } else {
      let findInterest = await Interest.findOne({ name: req.body.interest });
      createdPost.interest.push(findInterest._id);
      await createdPost.save();
    }
  }

  return res.send({
    _id: post._id,
    message: "Data Successfully Posted",
  });
};

module.exports.createLearnWithBthrivePost = createLearnWithBthrivePost;

const learnWithBthrivePostList = async (req, res) => {
  if (req.query.sort || req.query.sort != "All_Time") time = Date.now();
  if (req.query.sort == "last_minute") time = 1 * 60 * 1000;
  if (req.query.sort == "last_hour") time = 60 * 60 * 1000;
  if (req.query.sort == "last_week") time = 7 * 24 * 60 * 60 * 1000;
  if (req.query.sort == "last_month") time = 30 * 24 * 60 * 60 * 1000;
  if (req.query.sort == "last_quarter") time = 90 * 24 * 60 * 60 * 1000;
  if (req.query.sort == "last_year") time = 365 * 24 * 60 * 60 * 1000;
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
          req.query.sort
            ? {
                creationDate: { $gt: new Date(Date.now() - time) },
              }
            : {},
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
            cond: {},
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
          function () {
            Interest.populate(
              populatedTransactions,
              { path: "interest" },
              function () {
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

module.exports.learnWithBthrivePostList = learnWithBthrivePostList;

const contactUsData = async (req, res) => {
  let time;
  if (req.query.sort) {
    if (req.query.sort == "last_minute") {
      time = 1 * 60 * 1000;
    } else if (req.query.sort == "last_hour") {
      time = 60 * 60 * 1000;
    } else if (req.query.sort == "last_week") {
      time = 7 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_month") {
      time = 30 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_quarter") {
      time = 90 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_year") {
      time = 365 * 24 * 60 * 60 * 1000;
    }
  }
  a = ContactUs.aggregate([
    {
      $match: {
        $and: [
          req.query.sort && req.query.sort != "All_Time"
            ? { creationDate: { $gt: new Date(Date.now() - time) } }
            : {},
        ],
      },
    },
    { $sort: { creationDate: -1 } },
  ]).exec(function (err, transactions) {
    if (err) throw err;
    return res.send({
      contactusdata: transactions,
    });
  });
};
module.exports.contactUsData = contactUsData;

const feedBackData = async (req, res) => {
  let time;
  if (req.query.sort) {
    if (req.query.sort == "last_minute") {
      time = 1 * 60 * 1000;
    } else if (req.query.sort == "last_hour") {
      time = 60 * 60 * 1000;
    } else if (req.query.sort == "last_week") {
      time = 7 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_month") {
      time = 30 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_quarter") {
      time = 90 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_year") {
      time = 365 * 24 * 60 * 60 * 1000;
    }
  }
  a = Feedback.aggregate([
    {
      $match: {
        $and: [
          req.query.sort && req.query.sort != "All_Time"
            ? { creationDate: { $gt: new Date(Date.now() - time) } }
            : {},
        ],
      },
    },
    { $sort: { creationDate: -1 } },
  ]).exec(async function (err, transactions) {
    if (err) throw err;
    let result = [];
    for (const feedname of transactions) {
      let feedback = await Feedback.findById(feedname._id).populate(
        "user",
        "name"
      );
      result.push(feedback);
    }
    return res.send({
      feedbackdata: result,
    });
  });
};
module.exports.feedBackData = feedBackData;

const usersProfileDetail = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }
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
        from: "blogs",
        localField: "_id",
        foreignField: "createdBy",
        as: "users-blogs",
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
    if (transactions[0].postsBookmarked != undefined)
      transactions[0].total_bookmarks = transactions[0].postsBookmarked.length;
    else transactions[0].total_bookmarks = 0;
    interest = [];
    for (const i of transactions[0].interest) {
      const name = await Interest.findById(i).select({ name: 1 });
      interest.push(name);
    }
    transactions[0].interest = interest;
    return res.send({
      adminUsersData: transactions,
    });
  });
};
module.exports.usersProfileDetail = usersProfileDetail;

const usersUsage = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }
  let user = await User.findById(req.params.id).select({
    name: 1,
    numberOfLogins: 1,
  });
  let reactionCount =
    (await Like.find({ createdBy: req.params.id }).count()) +
    (await CollectionLike.find({ createdBy: req.params.id }).count());
  let commentCount = await Comment.find({ createdBy: req.params.id }).count();
  let eventAttendeesCount = 0;
  let eventList = await EventDetails.find().select({ attendees: 1 });
  for (let a of eventList)
    for (let b of a.attendees) if (req.params.id == b) eventAttendeesCount++;
  let questionCount = await Post.find({
    createdBy: req.params.id,
    type: "question",
  }).count();
  let collectionCount = await Collection.find({
    createdBy: req.params.id,
  }).count();

  res.send({
    questionCount: questionCount,
    commentCount: commentCount,
    reactionCount: reactionCount,
    collectionCount: collectionCount,
    eventAttendeesCount: eventAttendeesCount,
    numberOfLogins: user.numberOfLogins,
  });
};
module.exports.usersUsage = usersUsage;

const usersActivity = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }

  if (req.query.sort || req.query.sort != "All_Time") {
    time = Date.now();
  }
  if (req.query.sort == "last_minute") {
    time = 1 * 60 * 1000;
  }
  if (req.query.sort == "last_hour") {
    time = 60 * 60 * 1000;
  }
  if (req.query.sort == "last_week") {
    time = 7 * 24 * 60 * 60 * 1000;
  }
  if (req.query.sort == "last_month") {
    time = 30 * 24 * 60 * 60 * 1000;
  }
  if (req.query.sort == "last_quarter") {
    time = 90 * 24 * 60 * 60 * 1000;
  }
  if (req.query.sort == "last_year") {
    time = 365 * 24 * 60 * 60 * 1000;
  }

  let user = await User.findById(req.params.id)
    .select({ name: 1, profilePicture: 1 })
    .lean();
  let likes = await Like.find({
    createdBy: user._id,
    creationDate: { $gt: new Date(Date.now() - time) },
  })
    .select({ creationDate: 1, type: 1 })
    .lean();
  let comments = await Comment.find({
    createdBy: user._id,
    creationDate: { $gt: new Date(Date.now() - time) },
  })
    .select({ creationDate: 1, type: 1 })
    .lean();
  let collectionLike = await CollectionLike.find({
    createdBy: user._id,
    creationDate: { $gt: new Date(Date.now() - time) },
  })
    .select({ creationDate: 1 })
    .lean();
  let posts = await Post.find({
    createdBy: user._id,
    creationDate: { $gt: new Date(Date.now() - time) },
  })
    .select({ creationDate: 1, type: 1 })
    .lean();
  let collections = await Collection.find({
    createdBy: user._id,
    creationDate: { $gt: new Date(Date.now() - time) },
  })
    .select({ creationDate: 1 })
    .lean();
  user.activity = likes;
  for (let a of comments) user.activity.push(a);
  for (let a of collectionLike) user.activity.push(a);
  for (let a of posts) user.activity.push(a);
  for (let a of collections) {
    a.type = "collection";
    user.activity.push(a);
  }

  user.activity.sort((a, b) =>
    a.creationDate > b.creationDate
      ? 1
      : b.creationDate > a.creationDate
      ? -1
      : 0
  );
  user.activity = user.activity.reverse();
  res.send({
    usersActivity: user,
  });
};
module.exports.usersActivity = usersActivity;

const adminData = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }

  if (req.query.sort || req.query.sort != "All_Time") {
    time = Date.now();
  }
  if (req.query.sort == "last_minute") {
    time = 1 * 60 * 1000;
  }
  if (req.query.sort == "last_hour") {
    time = 60 * 60 * 1000;
  }
  if (req.query.sort == "last_week") {
    time = 7 * 24 * 60 * 60 * 1000;
  }
  if (req.query.sort == "last_month") {
    time = 30 * 24 * 60 * 60 * 1000;
  }
  if (req.query.sort == "last_quarter") {
    time = 90 * 24 * 60 * 60 * 1000;
  }
  if (req.query.sort == "last_year") {
    time = 365 * 24 * 60 * 60 * 1000;
  }

  let usersCount = await User.find({
    accountCreationDate: { $gt: new Date(Date.now() - time) },
    isBlogger: false,
    isVerified: true,
    registerationStatus: true,
  }).count();
  let loggedInCount = await User.find({
    loginTime: { $gt: new Date(Date.now() - time) },
    isLoggedIn: true,
  }).count();
  let deactivatedAccountCount = await User.find({
    accountCreationDate: { $gt: new Date(Date.now() - time) },
    isDeactivated: "true",
  }).count();
  let bloggersCount = await User.find({
    accountCreationDate: { $gt: new Date(Date.now() - time) },
    isBlogger: true,
    isVerified: true,
    registerationStatus: true,
  }).count();
  let avgTime = await User.find().select({ averageTimeSpent: 1 });
  let totalTime = 0;
  for (const t of avgTime) totalTime += t.averageTimeSpent;
  let postCount = await Post.find({
    creationDate: { $gt: new Date(Date.now() - time) },
    type: "post",
  }).count();
  let postsReportedCount = await Report.find({
    creationDate: { $gt: new Date(Date.now() - time) },
  }).distinct("postId");
  let questionCount = await Post.find({
    creationDate: { $gt: new Date(Date.now() - time) },
    type: "question",
  }).count();
  let commentCount = await Comment.find({
    creationDate: { $gt: new Date(Date.now() - time) },
    type: "comment",
  }).count();
  let reactionCount =
    (await Like.find({
      creationDate: { $gt: new Date(Date.now() - time) },
    }).count()) +
    (await CollectionLike.find({
      creationDate: { $gt: new Date(Date.now() - time) },
    }).count());
  let collectionCount = await Collection.find({
    creationDate: { $gt: new Date(Date.now() - time) },
  }).count();
  let eventHostCount = await BecomeHost.find({
    requestDate: { $gt: new Date(Date.now() - time) },
  }).count();
  let eventAttendees = await EventDetails.find({
    date: { $gt: new Date(Date.now() - time) },
  });
  let eventAttendeesCount = 0;
  for (const c of eventAttendees) eventAttendeesCount += c.attendees.length;

  return res.send({
    admin: admin,
    usersCount: usersCount,
    loggedInCount: loggedInCount,
    deactivatedAccountCount: deactivatedAccountCount,
    bloggersCount: bloggersCount,
    avgTime: Math.round(totalTime / (usersCount + bloggersCount)),
    postCount: postCount,
    questionCount: questionCount,
    commentCount: commentCount,
    reactionCount: reactionCount,
    collectionCount: collectionCount,
    eventHostCount: eventHostCount,
    eventAttendeesCount: eventAttendeesCount,
    postsReportedCount: postsReportedCount.length,

    message: `Welcome ${admin.name}`,
  });
};
module.exports.adminData = adminData;

const changeCollaboration = async (req, res) => {
  user = await User.findById(req.params.id);
  user.isCollaborated = !user.isCollaborated;
  user.save();
  res.send({
    message: "Collaboration Changed",
  });
};

module.exports.changeCollaboration = changeCollaboration;

const getReports = async (req, res) => {
  let time;
  if (req.query.sort) {
    if (req.query.sort == "last_minute") {
      time = 1 * 60 * 1000;
    } else if (req.query.sort == "last_hour") {
      time = 60 * 60 * 1000;
    } else if (req.query.sort == "last_week") {
      time = 7 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_month") {
      time = 30 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_quarter") {
      time = 90 * 24 * 60 * 60 * 1000;
    } else if (req.query.sort == "last_year") {
      time = 365 * 24 * 60 * 60 * 1000;
    }
  }

  a = Report.aggregate([
    {
      $match: {
        $and: [
          req.query.sort && req.query.sort != "All_Time"
            ? { creationDate: { $gt: new Date(Date.now() - time) } }
            : {},
        ],
      },
    },
    { $sort: { creationDate: -1 } },
  ]).exec(async function (err, transactions) {
    if (err) throw err;
    for (const report of transactions) {
      const post = await Post.findById(report.postId);
      if (!post) report.postType = "bookClubPost";
      else report.postType = "post";
      report.reportedBy = await User.findById(report.reportedBy).select();
    }
    res.send({
      reports: transactions,
    });
  });
};
module.exports.getReports = getReports;

const editEventOrClass = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }

  if (req.body.type === "event") {
    let event = await EventDetails.findById(req.params.id);
    event.name = req.body.name;
    event.event_name = req.body.event_name;
    event.host_email = req.body.host_email;
    event.description = req.body.description;
    event.date = req.body.date;
    event.time = req.body.time;
    event.imagePath = req.files[0].location;

    await event.save();
  } else if (req.body.type === "class") {
    let classes = await ClassDetails.findById(req.params.id);
    if (!classes) return;
    classes.name = req.body.name;
    classes.event_name = req.body.event_name;
    classes.host_email = req.body.host_email;
    classes.description = req.body.description;
    classes.date = req.body.date;
    classes.time = req.body.time;
    classes.imagePath = req.files[0].location;
    await classes.save();
  }
  return res.send({
    message: `${req.body.type} updated successfully`,
  });
};

module.exports.editEventOrClass = editEventOrClass;

const deleteEventOrClass = async (req, res) => {
  let event = await EventDetails.findById(req.params.id);
  if (!event) {
    let classes = await ClassDetails.findById(req.params.id);
    await classes.delete();
    return res.send({
      message: `Class Deleted Successfully`,
    });
  }
  await event.delete();

  return res.send({ message: "Event Deleted Successfully" });
};

module.exports.deleteEventOrClass = deleteEventOrClass;

const getHostRequests = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }

  if (req.query.sort || req.query.sort != "All_Time") {
    time = Date.now();
  }
  if (req.query.sort == "last_minute") {
    time = 1 * 60 * 1000;
  }
  if (req.query.sort == "last_hour") {
    time = 60 * 60 * 1000;
  }
  if (req.query.sort == "last_week") {
    time = 7 * 24 * 60 * 60 * 1000;
  }
  if (req.query.sort == "last_month") {
    time = 30 * 24 * 60 * 60 * 1000;
  }
  if (req.query.sort == "last_quarter") {
    time = 90 * 24 * 60 * 60 * 1000;
  }
  if (req.query.sort == "last_year") {
    time = 365 * 24 * 60 * 60 * 1000;
  }

  const hostData = await BecomeHost.find({
    requestDate: { $gt: Date.now() - time },
  }).lean();
  if (hostData[0]) {
    for (const h of hostData) {
      user = await User.findById(h.host).select({ name: 1, profilePicture: 1 });
      h.host = user;
    }
    hostData.sort((a, b) =>
      a.requestDate > b.requestDate ? 1 : b.requestDate > a.requestDate ? -1 : 0
    );
  }
  return res.send({
    host: hostData.reverse(),
  });
};

module.exports.getHostRequests = getHostRequests;

const getHostDetail = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }

  const hostData = await BecomeHost.findById(
    mongoose.Types.ObjectId(req.params.id)
  ).lean();
  user = await User.findById(hostData.host).select({
    name: 1,
    profilePicture: 1,
    email: 1,
  });
  hostData.host = user;
  return res.send({
    host: hostData,
  });
};

module.exports.getHostDetail = getHostDetail;

const createHost = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }

  const hostData = await BecomeHost.findById(
    mongoose.Types.ObjectId(req.params.id)
  );
  const date = new Date();
  if (date.getFullYear() > hostData.year)
    return res.status(400).send({ error: "Month is Past" });
  if (date.getMonth() + 1 > hostData.month)
    return res.status(400).send({ error: "Month is Past" });
  const hostOfMonth = await BecomeHost.find({
    month: hostData.month,
    year: hostData.year,
    isApproved: true,
  });
  if (hostOfMonth[0])
    return res
      .status(400)
      .send({ error: "Host of this month is already created" });
  hostData.isApproved = true;
  await hostData.save();
  return res.send({
    message: "Host of the month created",
  });
};

module.exports.createHost = createHost;

const addZoomLink = async (req, res) => {
  let admin = await Admin.findById(req.user._id);
  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });
  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }
  const data = await BookClubData.find();
  if (!data.length)
    await BookClubData.create({
      link: req.body.link,
    });
  else
    await BookClubData.findByIdAndUpdate(data[0]._id, { link: req.body.link });
  return res.send({
    message: "Zoom Link Added",
  });
};

module.exports.addZoomLink = addZoomLink;

const removeHost = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }

  const hostData = await BecomeHost.findById(
    mongoose.Types.ObjectId(req.params.id)
  );
  const date = new Date();
  if (date.getFullYear() > hostData.year)
    return res.status(400).send({ error: "Month is Past" });
  if (date.getMonth() + 1 > hostData.month)
    return res.status(400).send({ error: "Month is Past" });
  hostData.isApproved = false;
  await hostData.save();
  return res.send({
    message: "Host of the month Removed",
  });
};

module.exports.removeHost = removeHost;

const adminOtherPostList = async (req, res) => {
  const id = req.params.id;
  const type = req.params.type;
  list = await Post.find({
    status: "active",
    type: req.params.type == "post" ? "post" : "question",
  })
    .sort({ creationDate: -1 })
    .populate(["interest", "createdBy"]);
  if (req.query.collectionId) {
    var collectionList = await Collection.findOne({
      _id: mongoose.Types.ObjectId(req.query.collectionId),
    });
  }

  a = Post.aggregate([
    {
      $match: {
        $and: [
          req.query.collectionId ? { _id: { $in: collectionList.post } } : {},
          { status: "active" },
          req.query.type ? { createdBy: mongoose.Types.ObjectId(id) } : {},
          { type: type == "post" ? "post" : "question" },
        ],
      },
    },
    { $sort: { creationDate: req.query.sort == "asc" ? 1 : -1 } },
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
          { $skip: req.query.page == 1 ? 0 : (req.query.page - 1) * 3 },
          { $limit: 3 },
        ], // add projection here wish you re-shape the docs
      },
    },
  ]).exec(function (err, transactions) {
    if (err) throw err;
    User.populate(
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

module.exports.adminOtherPostList = adminOtherPostList;

const deletePost = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (admin.isAdmin === false) {
    res.status(403).send({ error: "Access Denied" });
  }
  let post = await Post.findById(req.params.id);
  let bookClubPost = await BookClubPost.findById(req.params.id);
  let likes = await Like.find({ postId: req.params.id });
  let comments = await Comment.find({ postId: req.params.id });
  let reports = await Report.find({ postId: req.params.id });
  let users = await User.find().select({ postsBookmarked: 1 });
  if (!post) await bookClubPost.delete();
  else await post.delete();
  for (const like of likes) like.delete();
  for (const comment of comments) comment.delete();
  for (const report of reports) report.delete();
  for (const u of users) {
    if (u.postsBookmarked.includes(req.params.id))
      u.postsBookmarked.splice(u.postsBookmarked.indexOf(req.params.id), 1);
    await u.save();
  }
  return res.send({ message: "Post Deleted Successfully" });
};

module.exports.deletePost = deletePost;

const deleteLearnWithBthrivePosts = async (req, res) => {
  let post = await LearnWithBthrivePost.findById(req.params.id);
  let likes = await Like.find({ postId: req.params.id });
  let comments = await Comment.find({ postId: req.params.id });
  await post.delete();
  for (const like of likes) like.delete();
  for (const comment of comments) comment.delete();
  return res.send({ message: "Post Deleted Successfully" });
};

module.exports.deleteLearnWithBthrivePosts = deleteLearnWithBthrivePosts;

const adminDeleteInterest = async (req, res) => {
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

module.exports.adminDeleteInterest = adminDeleteInterest;

const AdminGetEvents = async (req, res) => {
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
module.exports.AdminGetEvents = AdminGetEvents;

const AdminGetClasses = async (req, res) => {
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
module.exports.AdminGetClasses = AdminGetClasses;

const adminOtherCollectionList = async (req, res) => {
  a = Collection.aggregate([
    {
      $match: {
        $and: [
          { status: "active" },
          req.query.type
            ? { createdBy: mongoose.Types.ObjectId(req.params.id) }
            : {},
        ],
      },
    },
    { $sort: { creationDate: -1 } },
    {
      $lookup: {
        from: "collectionlikes",
        localField: "_id",
        foreignField: "collectionId",
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
          { $skip: req.query.page == 1 ? 0 : (req.query.page - 1) * 3 },
          { $limit: 3 },
        ], // add projection here wish you re-shape the docs
      },
    },
  ]).exec(function (err, transactions) {
    if (err) throw err;
    User.populate(
      transactions[0].data,
      { path: "createdBy" },
      function (err, populatedTransactions) {
        User.populate(
          populatedTransactions,
          { path: "likeList.createdBy" },
          function (err, populatedTransactions2) {
            Post.populate(
              populatedTransactions,
              { path: "post" },
              function (err, populatedTransactions1) {
                return res.send({
                  collectionList: transactions,
                });
              }
            );
          }
        );
      }
    );
  });
};

module.exports.adminOtherCollectionList = adminOtherCollectionList;

const adminApproveInsight = async (req, res) => {
  let list1 = await Comment.findById(req.body._id);

  list1.showStatus = req.body.type == "add" ? "approved" : "declined";
  await list1.save();

  return res.send({
    message: "Insight Successfully Updated",
  });
};

module.exports.adminApproveInsight = adminApproveInsight;

const adminCommentList = async (req, res) => {
  let postData;
  if (req.query.modal == "learn")
    postData = await LearnWithBthrivePost.find({
      _id: req.params.id,
    }).populate("createdBy");
  else if (req.query.model == "bookClubPost")
    postData = await BookClubPost.find({
      _id: req.params.id,
    }).populate("createdBy");
  else
    postData = await Post.find({
      _id: req.params.id,
    }).populate("createdBy");
  if (req.user._id == postData[0].createdBy._id) {
    list1 = await Comment.find({
      postId: req.params.id,
      status: "active",
      $or: [
        { showStatus: "approved" },
        { showStatus: "waiting" },
        // { createdBy: { $nin: req.user.usersBlocked } },
      ],
      type: req.params.type == "comment" ? "comment" : "insight",
    })
      .sort({ creationDate: -1 })
      .populate(["createdBy"]);
  } else {
    if (req.query.admin) {
      list1 = await Comment.find({
        postId: req.params.id,
        status: "active",
        showStatus: { $ne: "declined" },
        type: req.params.type == "comment" ? "comment" : "insight",
      })
        .sort({ creationDate: -1 })
        .populate(["createdBy"]);
    } else
      list1 = await Comment.find({
        postId: req.params.id,
        status: "active",
        showStatus: "approved",
        type: req.params.type == "comment" ? "comment" : "insight",
      })
        .sort({ creationDate: -1 })
        .populate(["createdBy"]);
  }
  return res.send({
    commentList: list1,
  });
};

module.exports.adminCommentList = adminCommentList;

const adminOtherBlogList = async (req, res) => {
  postData = await Blog.find({
    createdBy: req.params.id,
    status: "active",
  }).populate("createdBy");
  //edit details

  return res.send({
    blogList: postData,
  });
};

module.exports.adminOtherBlogList = adminOtherBlogList;

const adminPostDetail = async (req, res) => {
  list = await Post.findOne({
    _id: req.params.id,
  }).populate(["interest", "createdBy"]);

  a = Post.aggregate([
    {
      $match: {
        $and: [{ _id: mongoose.Types.ObjectId(req.params.id) }],
      },
    },
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
              // $in: [
              //   mongoose.Types.ObjectId(req.user._id),
              //   "$likeList.createdBy",
              // ],
            },
            // "cond":{ $eq: ["$likeList.createdBy", req.user._id] },
          },
        },
      },
    },
  ]).exec(function (err, transactions) {
    //if (err) throw err;
    User.populate(
      transactions,
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
                  postDetail: transactions,
                });
              }
            );
          }
        );
      }
    );
  });
};

module.exports.adminPostDetail = adminPostDetail;

const adminCollectionDetail = async (req, res) => {
  a = Collection.aggregate([
    {
      $match: {
        $and: [{ _id: mongoose.Types.ObjectId(req.params.id) }],
      },
    },
    {
      $lookup: {
        from: "collectionlikes",
        localField: "_id",
        foreignField: "collectionId",
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
  ]).exec(function (err, transactions) {
    if (err) throw err;
    User.populate(
      transactions,
      { path: "createdBy" },
      function (err, populatedTransactions) {
        User.populate(
          populatedTransactions,
          { path: "likeList.createdBy" },
          function (err, populatedTransactions2) {
            Post.populate(
              populatedTransactions,
              { path: "post" },
              function (err, populatedTransactions1) {
                return res.send({
                  collectionDetail: transactions,
                });
              }
            );
          }
        );
      }
    );
  });
};

module.exports.adminCollectionDetail = adminCollectionDetail;

const adminChangePassword = async (req, res) => {
  //joi schema
  const schema = {
    oldPassword: joiSchema.password,
    newPassword: joiSchema.newPassword,
    confirmNewPassword: joiSchema.newPassword,
  };
  //input validation
  const { error } = validateUsingJoi(req.body, schema);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.body.newPassword !== req.body.confirmNewPassword)
    return res.status(400).send({ error: "Password Mismatch" });

  //check whether user registered or not
  let user;
  user = await Admin.findById(req.user._id);
  if (!user) return res.status(404).send({ error: "User Not Registered" });

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
module.exports.adminChangePassword = adminChangePassword;

const adminBookClubPostList = async (req, res) => {
  list = await BookClubPost.find({
    status: "active",
    type: req.params.type == "post" ? "post" : "question",
  })
    .sort({ creationDate: -1 })
    .populate(["interest", "createdBy"]);
  if (req.query.collectionId) {
    var collectionList = await Collection.findOne({
      _id: mongoose.Types.ObjectId(req.query.collectionId),
    });
  }
  a = BookClubPost.aggregate([
    {
      $match: {
        $and: [
          req.query.id ? { _id: mongoose.Types.ObjectId(req.query.id) } : {},
          req.query.collectionId
            ? { _id: { $in: collectionList.bookClubPost } }
            : {},
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
    { $sort: { creationDate: req.query.sort == "asc" ? 1 : -1 } },
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
              // $in: [
              //   mongoose.Types.ObjectId(req.user._id),
              //   "$likeList.createdBy",
              // ],
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
          { $skip: req.query.page == 1 ? 0 : (req.query.page - 1) * 3 },
          { $limit: 3 },
        ], // add projection here wish you re-shape the docs
      },
    },
  ]).exec(function (err, transactions) {
    if (err) throw err;
    User.populate(
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

module.exports.adminBookClubPostList = adminBookClubPostList;

const graphData = async (req, res) => {
  let admin = await Admin.findById(req.user._id);

  if (!admin) return res.status(404).send({ error: "Admin is Not Registered" });

  if (!admin.isAdmin) {
    res.status(403).send({ error: "Access Denied" });
  }

  time1 = 1 * 24 * 60 * 60 * 1000;
  time2 = 2 * 24 * 60 * 60 * 1000;
  time3 = 3 * 24 * 60 * 60 * 1000;
  time4 = 4 * 24 * 60 * 60 * 1000;
  time5 = 5 * 24 * 60 * 60 * 1000;
  time6 = 6 * 24 * 60 * 60 * 1000;
  time7 = 7 * 24 * 60 * 60 * 1000;
  let newSignup1 = await User.find({
    accountCreationDate: { $gt: new Date(Date.now() - time1) },
    isVerified: true,
    registerationStatus: true,
  }).count();
  let posts1 = await Post.find({
    creationDate: { $gt: new Date(Date.now() - time1) },
    type: "post",
  }).count();
  let bookClubPosts1 = await BookClubPost.find({
    creationDate: { $gt: new Date(Date.now() - time1) },
    type: "post",
  }).count();
  let collections1 = await Collection.find({
    creationDate: { $gt: new Date(Date.now() - time1) },
  }).count();
  let newSignup2 = await User.find({
    accountCreationDate: {
      $gt: new Date(Date.now() - time2),
      $lt: new Date(Date.now() - time1),
    },
    isVerified: true,
    registerationStatus: true,
  }).count();
  let posts2 = await Post.find({
    creationDate: {
      $gt: new Date(Date.now() - time2),
      $lt: new Date(Date.now() - time1),
    },
    type: "post",
  }).count();
  let bookClubPosts2 = await BookClubPost.find({
    creationDate: {
      $gt: new Date(Date.now() - time2),
      $lt: new Date(Date.now() - time1),
    },
    type: "post",
  }).count();
  let collections2 = await Collection.find({
    creationDate: {
      $gt: new Date(Date.now() - time2),
      $lt: new Date(Date.now() - time1),
    },
  }).count();
  let newSignup3 = await User.find({
    accountCreationDate: {
      $gt: new Date(Date.now() - time3),
      $lt: new Date(Date.now() - time2),
    },
    isVerified: true,
    registerationStatus: true,
  }).count();
  let posts3 = await Post.find({
    creationDate: {
      $gt: new Date(Date.now() - time3),
      $lt: new Date(Date.now() - time2),
    },
    type: "post",
  }).count();
  let bookClubPosts3 = await BookClubPost.find({
    creationDate: {
      $gt: new Date(Date.now() - time3),
      $lt: new Date(Date.now() - time2),
    },
    type: "post",
  }).count();
  let collections3 = await Collection.find({
    creationDate: {
      $gt: new Date(Date.now() - time3),
      $lt: new Date(Date.now() - time2),
    },
  }).count();
  let newSignup4 = await User.find({
    accountCreationDate: {
      $gt: new Date(Date.now() - time4),
      $lt: new Date(Date.now() - time3),
    },
    isVerified: true,
    registerationStatus: true,
  }).count();
  let posts4 = await Post.find({
    creationDate: {
      $gt: new Date(Date.now() - time4),
      $lt: new Date(Date.now() - time3),
    },
    type: "post",
  }).count();
  let bookClubPosts4 = await BookClubPost.find({
    creationDate: {
      $gt: new Date(Date.now() - time4),
      $lt: new Date(Date.now() - time3),
    },
    type: "post",
  }).count();
  let collections4 = await Collection.find({
    creationDate: {
      $gt: new Date(Date.now() - time4),
      $lt: new Date(Date.now() - time3),
    },
  }).count();
  let newSignup5 = await User.find({
    accountCreationDate: {
      $gt: new Date(Date.now() - time5),
      $lt: new Date(Date.now() - time4),
    },
    isVerified: true,
    registerationStatus: true,
  }).count();
  let posts5 = await Post.find({
    creationDate: {
      $gt: new Date(Date.now() - time5),
      $lt: new Date(Date.now() - time4),
    },
    type: "post",
  }).count();
  let bookClubPosts5 = await BookClubPost.find({
    creationDate: {
      $gt: new Date(Date.now() - time5),
      $lt: new Date(Date.now() - time4),
    },
    type: "post",
  }).count();
  let collections5 = await Collection.find({
    creationDate: {
      $gt: new Date(Date.now() - time5),
      $lt: new Date(Date.now() - time4),
    },
  }).count();
  let newSignup6 = await User.find({
    accountCreationDate: {
      $gt: new Date(Date.now() - time6),
      $lt: new Date(Date.now() - time5),
    },
    isVerified: true,
    registerationStatus: true,
  }).count();
  let posts6 = await Post.find({
    creationDate: {
      $gt: new Date(Date.now() - time6),
      $lt: new Date(Date.now() - time5),
    },
    type: "post",
  }).count();
  let bookClubPosts6 = await BookClubPost.find({
    creationDate: {
      $gt: new Date(Date.now() - time6),
      $lt: new Date(Date.now() - time5),
    },
    type: "post",
  }).count();
  let collections6 = await Collection.find({
    creationDate: {
      $gt: new Date(Date.now() - time6),
      $lt: new Date(Date.now() - time5),
    },
  }).count();
  let newSignup7 = await User.find({
    accountCreationDate: {
      $gt: new Date(Date.now() - time7),
      $lt: new Date(Date.now() - time6),
    },
    isVerified: true,
    registerationStatus: true,
  }).count();
  let posts7 = await Post.find({
    creationDate: {
      $gt: new Date(Date.now() - time7),
      $lt: new Date(Date.now() - time6),
    },
    type: "post",
  }).count();
  let bookClubPosts7 = await BookClubPost.find({
    creationDate: {
      $gt: new Date(Date.now() - time7),
      $lt: new Date(Date.now() - time6),
    },
    type: "post",
  }).count();
  let collections7 = await Collection.find({
    creationDate: {
      $gt: new Date(Date.now() - time7),
      $lt: new Date(Date.now() - time6),
    },
  }).count();
  return res.send({
    newSignup1: newSignup1,
    posts1: posts1 + bookClubPosts1,
    collections1: collections1,
    newSignup2: newSignup2,
    posts2: posts2 + bookClubPosts2,
    collections2: collections2,
    newSignup3: newSignup3,
    posts3: posts3 + bookClubPosts3,
    collections3: collections3,
    newSignup4: newSignup4,
    posts4: posts4 + bookClubPosts4,
    collections4: collections4,
    newSignup5: newSignup5,
    posts5: posts5 + bookClubPosts5,
    collections5: collections5,
    newSignup6: newSignup6,
    posts6: posts6 + bookClubPosts6,
    collections6: collections6,
    newSignup7: newSignup7,
    posts7: posts7 + bookClubPosts7,
    collections7: collections7,
    date: Date.now(),
  });
};
module.exports.graphData = graphData;

const editLearnWithBthrivePost = async (req, res) => {
  let post = await LearnWithBthrivePost.findById(req.body.id);
  post.description = req.body.description;
  post.web_link = req.body.web_link;
  post.link = req.body.link;
  var images = req.files;
  for (const image of post.images) {
    let isArray = Array.isArray(req.body.files);
    if (!req.body.files) post.images = [];
    else if (!isArray) {
      if (req.body.files !== image) post.images = [];
    } else if (!req.body.files.includes(image))
      post.images.splice(post.images.indexOf(image), 1);
  }
  for (const video of post.videos) {
    let isArray = Array.isArray(req.body.files);
    if (!req.body.files) post.videos = [];
    else if (!isArray) {
      if (req.body.files !== video) post.videos = [];
    } else if (!req.body.files.includes(video))
      post.videos.splice(post.videos.indexOf(video), 1);
  }
  for (i = 0; i < req.files.length; i++) {
    if (images[i].mimetype.startsWith("video")) {
      post.videos.push(images[i].location);
    } else {
      post.images.push(images[i].location);
    }
  }
  if (req.body.interest) {
    let isArray = Array.isArray(req.body.interest);
    if (isArray) {
      let interests = [];
      for (i = 0; i < req.body.interest.length; i++) {
        let findInterest = await Interest.findById(req.body.interest[i]);
        interests.push(findInterest._id);
      }
      post.interest = interests;
    } else {
      let interests = [];
      let findInterest = await Interest.findById(req.body.interest);
      interests.push(findInterest._id);
      post.interest = interests;
    }
  }
  await post.save();
  return res.send({
    _id: post._id,
    message: `Post Edited Successfully`,
  });
};

module.exports.editLearnWithBthrivePost = editLearnWithBthrivePost;
