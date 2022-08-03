const { User } = require("../models/userSchema");
const { Post } = require("../models/postSchema");
const { BookClubPost } = require("../models/bookClubPostsSchema");
const { Blog } = require("../models/blogSchema");
const { Comment } = require("../models/commentSchema");
const { Collection } = require("../models/collectionSchema");
const { Like } = require("../models/likeSchema");
const { CollectionLike } = require("../models/collectionLikeSchema");
const { Interest } = require("../models/interestSchema");
const mongoose = require("mongoose");
const {
  LearnWithBthrivePost,
} = require("../models/learnWithBthrivePostSchema");
const { Report } = require("../models/reportSchema");
const { EventDetails } = require("../models/eventSchema");
const { ClassDetails } = require("../models/classSchema");
// const AWS = require("aws-sdk");
// const s3 = new AWS.S3({
//   accessKeyId: "AKIAZEB4U57ODQNELTUN",
//   secretAccessKey: "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",
// });
// const fs = require("fs");
const createPost = async (req, res) => {
  console.log(req.body, req.files);
  post = new Post({
    description: req.body.description,
    web_link: req.body.web_link,
    link: req.body.link,
    status: "active",
    type: req.body.type == "post" ? "post" : "question",
    createdBy: req.user._id,
    creationDate: Date.now(),
  });
  await post.save();

  let createdPost = await Post.findById(post._id);
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

module.exports.createPost = createPost;

const deleteMyPost = async (req, res) => {
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

module.exports.deleteMyPost = deleteMyPost;

const createBookClubPost = async (req, res) => {
  post = new BookClubPost({
    description: req.body.description,
    web_link: req.body.web_link,
    link: req.body.link,
    status: "active",
    type: req.body.type == "post" ? "post" : "question",
    createdBy: req.user._id,
    creationDate: Date.now(),
  });
  await post.save();

  let createdPost = await BookClubPost.findById(post._id);

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

module.exports.createBookClubPost = createBookClubPost;

const postList = async (req, res) => {
  list = await Post.find({
    status: "active",
    type: req.params.type == "post" ? "post" : "question",
    createdBy: { $nin: req.user.usersBlocked },
  })
    .sort({ creationDate: -1 })
    .populate(["interest", "createdBy"]);
  if (req.query.collectionId) {
    var collectionList = await Collection.findOne({
      _id: mongoose.Types.ObjectId(req.query.collectionId),
    });
  }
  let user = await User.findById(req.user._id);
  if (user.isDeactivated) {
    user.isDeactivated = false;
    let posts = await Post.find({ createdBy: req.user._id });
    let collections = await Collection.find({ createdBy: req.user._id });
    let likes = await Like.find({ createdBy: req.user._id });
    let comments = await Comment.find({ createdBy: req.user._id });
    let clikes = await CollectionLike.find({ createdBy: req.user._id });
    let bookclubs = await BookClubPost.find({ createdBy: req.user._id });
    for (const post of posts) {
      post.status = "active";
      await post.save();
    }
    for (const collection of collections) {
      collection.status = "active";
      await collection.save();
    }
    for (const like of likes) {
      like.status = "active";
      await like.save();
    }
    for (const comment of comments) {
      comment.status = "active";
      await comment.save();
    }
    for (const clike of clikes) {
      clike.status = "active";
      await clike.save();
    }
    for (const bookclub of bookclubs) {
      bookclub.status = "active";
      await bookclub.save();
    }
    await user.save();
  }

  a = Post.aggregate([
    {
      $match: {
        $and: [
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
      $sort:
        req.query.sort == "popular"
          ? { total_likes: -1 }
          : { creationDate: -1 },
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
        //
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

module.exports.postList = postList;

const bookmarkPostList = async (req, res) => {
  list = await Post.find({
    status: "active",
    type: req.params.type == "post" ? "post" : "question",
    createdBy: { $nin: req.user.usersBlocked },
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
      $sort:
        req.query.sort == "popular"
          ? { total_likes: -1 }
          : { creationDate: -1 },
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
    User.populate(
      transactions[0].data,
      { path: "createdBy" },
      function (err, populatedTransactions) {
        //
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

module.exports.bookmarkPostList = bookmarkPostList;

const bookClubPostList = async (req, res) => {
  list = await BookClubPost.find({
    status: "active",
    type: req.params.type == "post" ? "post" : "question",
    createdBy: { $nin: req.user.usersBlocked },
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
          { createdBy: { $nin: req.user.usersBlocked } },
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
      $sort:
        req.query.sort == "popular"
          ? { total_likes: -1 }
          : { creationDate: -1 },
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

module.exports.bookClubPostList = bookClubPostList;

const bookmarkBookClubPostList = async (req, res) => {
  list = await BookClubPost.find({
    status: "active",
    type: req.params.type == "post" ? "post" : "question",
    createdBy: { $nin: req.user.usersBlocked },
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
          { createdBy: { $nin: req.user.usersBlocked } },
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
      $sort:
        req.query.sort == "popular"
          ? { total_likes: -1 }
          : { creationDate: -1 },
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

module.exports.bookmarkBookClubPostList = bookmarkBookClubPostList;

const commentList = async (req, res) => {
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

module.exports.commentList = commentList;

const postDetail = async (req, res) => {
  if (!req.params.id) return;
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
        //
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

  // return res.send({
  //   postDetail: list,
  //   // postComment : comment
  // });
};

module.exports.postDetail = postDetail;

const createComment = async (req, res) => {
  let typeOfPost = "BookClubPost";
  if (req.params.typeOfPost.toLowerCase() === "post") {
    typeOfPost = "Post";
  }
  let list;
  if (req.query.modal)
    list = await LearnWithBthrivePost.findOne({
      _id: req.body.postId,
    });
  else
    list = await Post.findOne({
      _id: req.body.postId,
    }).populate("createdBy");
  post = new Comment({
    postId: req.body.postId,
    description: req.body.description,
    status: "active",
    type: req.body.type == "comment" ? "comment" : "insight",
    createdBy: req.user._id,
    showStatus: req.body.type == "comment" ? "approved" : "waiting",
    creationDate: Date.now(),
    onModel: typeOfPost,
  });
  await post.save();
  return res.send({
    _id: post._id,
    message:
      req.body.type == "comment"
        ? "Comment Successfully Posted"
        : `Insights has been sent to ${
            req.query.modal
              ? "Admin"
              : list.createdBy
              ? list.createdBy.name
              : ""
          } to Review and accept`,
  });
};

module.exports.createComment = createComment;

const approveInsight = async (req, res) => {
  let list1 = await Comment.findById(req.body._id);

  list1.showStatus = req.body.type == "add" ? "approved" : "declined";
  await list1.save();

  return res.send({
    message: "Insight Successfully Updated",
  });
};

module.exports.approveInsight = approveInsight;

const createLike = async (req, res) => {
  let typeOfPost = "BookClubPost";
  if (req.params.typeOfPost.toLowerCase() === "post") {
    typeOfPost = "Post";
  }
  var isLike = 0;
  checkLike = await Like.findOne({
    postId: req.body.postId,
    createdBy: req.user._id,
  });
  if (checkLike) {
    if (checkLike.type == req.body.type) {
      isLike = 1;
      checkLike.delete();
      return res.send({
        isLike: isLike,
        message: "Unliked Successfully",
      });
    } else {
      var myquery = {
        postId: req.body.postId,
        createdBy: req.user._id,
      };
      var newvalues = { $set: { type: req.body.type } };
      isLike = 2;
      Like.updateOne(myquery, newvalues, function (err, res) {
        if (err) throw err;
      });
    }
  } else {
    isLike = 3;
    post = new Like({
      postId: req.body.postId,
      type: req.body.type,
      createdBy: req.user._id,
      creationDate: Date.now(),
      onModel: typeOfPost,
    });

    await post.save();
  }

  return res.send({
    // _id: post._id,
    isLike: isLike,
    message: "Liked Successfully",
  });
};

module.exports.createLike = createLike;

const myPostList = async (req, res) => {
  list = await Post.find({
    status: "active",
    type: req.params.type == "post" ? "post" : "question",
  })
    .sort({ creationDate: -1 })
    .populate(["interest", "createdBy"]);
  let id = mongoose.Types.ObjectId(req.user._id);

  a = Post.aggregate([
    {
      $match: {
        $and: [{ createdBy: id }, { status: "active" }, { type: "post" }],
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
      $addFields: {
        total_comments: {
          $size: {
            $filter: {
              input: "$commentList",
              as: "mi",
              cond: {
                $and: [
                  { $eq: ["$commentList.type", "comment"] },
                  // { "showStatus": {"$eq": "approved"} },
                  // { $eq: ["showStatus", "approved"] },
                  // { "$in": [ "$_id", "$$lastViewed.members.groupId" ] }
                ],
              },
            },
          },
        },
        total_insights: {
          $size: {
            $filter: {
              input: "$commentList",
              as: "mi",
              cond: {
                $and: [
                  { $eq: ["type", "insight"] },
                  { $eq: ["showStatus", "approved"] },
                  // { "$in": [ "$_id", "$$lastViewed.members.groupId" ] }
                ],
              },
            },
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
        //
        Interest.populate(
          populatedTransactions,
          { path: "interest" },
          function (err, populatedTransactions1) {
            return res.send({
              myPostList: populatedTransactions1,
            });
          }
        );
      }
    );
  });
};

module.exports.myPostList = myPostList;

const createCollection = async (req, res) => {
  collection = new Collection({
    image: req.files[0].location,
    name: req.body.name,
    description: req.body.description,
    status: "active",
    createdBy: req.user._id,
    creationDate: Date.now(),
  });
  await collection.save();

  return res.send({
    _id: collection._id,
    message: "Collection Created Successfully",
  });
};

module.exports.createCollection = createCollection;

const deleteMyCollection = async (req, res) => {
  const collection = await Collection.findById(req.params.id);
  const collectionLikes = await CollectionLike.find({
    collectionId: req.params.id,
  });
  await collection.delete();
  for (const clike of collectionLikes) clike.delete();
  return res.send({ message: "Collection deleted Successfully" });
};

module.exports.deleteMyCollection = deleteMyCollection;

const collectionList = async (req, res) => {
  a = Collection.aggregate([
    {
      $match: {
        $and: [
          { status: "active" },
          req.query.type
            ? { createdBy: mongoose.Types.ObjectId(req.user._id) }
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

module.exports.collectionList = collectionList;

const collectionDetail = async (req, res) => {
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
              function (err, populatedTransactions3) {
                BookClubPost.populate(
                  populatedTransactions,
                  { path: "bookClubPost" },
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
      }
    );
  });
};

module.exports.collectionDetail = collectionDetail;

const addPostToCollection = async (req, res) => {
  list = await Collection.findOne({
    _id: req.body.collectionId,
  });
  let n;
  post = await Post.findById(req.body.postId);
  if (!post)
    n = list && list.bookClubPost && list.bookClubPost.indexOf(req.body.postId);
  else n = list && list.post && list.post.indexOf(req.body.postId);
  if (n == -1) {
    if (!post) {
      Collection.updateOne(
        { _id: mongoose.Types.ObjectId(req.body.collectionId) },
        {
          $push: {
            bookClubPost: mongoose.Types.ObjectId(req.body.postId),
          },
        },
        function (err, ress) {
          if (err) throw err;
          return res.send({
            // _id: collection._id,
            message: "Post Added in Collection",
          });
        }
      );
    } else {
      Collection.updateOne(
        { _id: mongoose.Types.ObjectId(req.body.collectionId) },
        {
          $push: {
            post: mongoose.Types.ObjectId(req.body.postId),
          },
        },
        function (err, ress) {
          if (err) throw err;
          return res.send({
            // _id: collection._id,
            message: "Post Added in Collection",
          });
        }
      );
    }
  } else {
    return res
      .status(400)
      .send({ error: "Post already added in this Collection" });
  }
};

module.exports.addPostToCollection = addPostToCollection;

const removePostFromCollection = async (req, res) => {
  list = await Collection.findOne({
    _id: req.body.collectionId,
  });
  post = await Post.findById(req.body.postId);
  if (!post)
    list.bookClubPost.splice(list.bookClubPost.indexOf(req.body.postId), 1);
  else list.post.splice(list.post.indexOf(req.body.postId), 1);
  await list.save();
  return res.send({
    message: "Post Removed from Collection",
  });
};

module.exports.removePostFromCollection = removePostFromCollection;

const likeList = async (req, res) => {
  let type;
  if (req.query.type == 11) type = ["11", "12", "13", "14"];
  else if (req.query.type == 21) type = ["21", "22", "23", "24"];
  else if (req.query.type == 31) type = ["31", "32", "33", "34"];
  else if (req.query.type == 41) type = ["41", "42", "43", "44"];
  else if (req.query.type == 5) type = ["5"];
  else if (req.query.type == 61) type = ["61", "62", "63", "64"];
  else if (req.query.type == 71) type = ["71", "72", "73", "74"];
  a = Like.aggregate([
    {
      $match: {
        $and: [
          req.query.id ? { postId: mongoose.Types.ObjectId(req.query.id) } : {},
          req.query.type ? { type: { $in: type } } : {},
        ],
      },
    },
    { $sort: { creationDate: -1 } },

    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "_id",
        as: "likeList",
      },
    },
  ]).exec(async function (err, transactions) {
    if (err) throw err;
    let likes = {};
    likes.total_likes = await Like.find({
      postId: mongoose.Types.ObjectId(req.query.id),
    }).count();
    likes.total_likes_1 = await Like.find({
      postId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [11, 12, 13, 14] },
    }).count();
    likes.total_likes_2 = await Like.find({
      postId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [21, 22, 23, 24] },
    }).count();
    likes.total_likes_3 = await Like.find({
      postId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [31, 32, 33, 34] },
    }).count();
    likes.total_likes_4 = await Like.find({
      postId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [41, 42, 43, 44] },
    }).count();
    likes.total_likes_5 = await Like.find({
      postId: mongoose.Types.ObjectId(req.query.id),
      type: 5,
    }).count();
    likes.total_likes_6 = await Like.find({
      postId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [61, 62, 63, 64] },
    }).count();
    likes.total_likes_7 = await Like.find({
      postId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [71, 72, 73, 74] },
    }).count();

    User.populate(
      transactions,
      { path: "createdBy" },
      function (err, populatedTransactions) {
        return res.send({
          likeList: transactions,
          likes: likes,
        });
      }
    );
  });
};

module.exports.likeList = likeList;

const collectionLikeList = async (req, res) => {
  let type;
  if (req.query.type == 11) type = ["11", "12", "13", "14"];
  else if (req.query.type == 21) type = ["21", "22", "23", "24"];
  else if (req.query.type == 31) type = ["31", "32", "33", "34"];
  else if (req.query.type == 41) type = ["41", "42", "43", "44"];
  else if (req.query.type == 5) type = ["5"];
  else if (req.query.type == 61) type = ["61", "62", "63", "64"];
  else if (req.query.type == 71) type = ["71", "72", "73", "74"];
  a = CollectionLike.aggregate([
    {
      $match: {
        $and: [
          { collectionId: mongoose.Types.ObjectId(req.query.id) },
          req.query.type ? { type: { $in: type } } : {},
        ],
      },
    },
    { $sort: { creationDate: -1 } },

    {
      $lookup: {
        from: "collectionlikes",
        localField: "_id",
        foreignField: "_id",
        as: "collectionLikeList",
      },
    },
  ]).exec(async function (err, transactions) {
    if (err) throw err;
    let likes = {};
    likes.total_likes = await CollectionLike.find({
      collectionId: mongoose.Types.ObjectId(req.query.id),
    }).count();
    likes.total_likes_1 = await CollectionLike.find({
      collectionId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [11, 12, 13, 14] },
    }).count();
    likes.total_likes_2 = await CollectionLike.find({
      collectionId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [21, 22, 23, 24] },
    }).count();
    likes.total_likes_3 = await CollectionLike.find({
      collectionId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [31, 32, 33, 34] },
    }).count();
    likes.total_likes_4 = await CollectionLike.find({
      collectionId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [41, 42, 43, 44] },
    }).count();
    likes.total_likes_5 = await CollectionLike.find({
      collectionId: mongoose.Types.ObjectId(req.query.id),
      type: 5,
    }).count();
    likes.total_likes_6 = await CollectionLike.find({
      collectionId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [61, 62, 63, 64] },
    }).count();
    likes.total_likes_7 = await CollectionLike.find({
      collectionId: mongoose.Types.ObjectId(req.query.id),
      type: { $in: [71, 72, 73, 74] },
    }).count();
    User.populate(
      transactions,
      { path: "createdBy" },
      function (err, populatedTransactions) {
        return res.send({
          collectionLikeList: transactions,
          likes: likes,
        });
      }
    );
  });
};

module.exports.collectionLikeList = collectionLikeList;

const createCollectionLike = async (req, res) => {
  var isLike = 0;
  checkLike = await CollectionLike.findOne({
    collectionId: req.body.collectionId,
    createdBy: req.user._id,
  });
  if (checkLike) {
    if (checkLike.type == req.body.type) {
      isLike = 1;
      checkLike.delete();
      return res.send({
        isLike: isLike,
        message: "Unliked Successfully",
      });
    } else {
      var myquery = {
        collectionId: req.body.collectionId,
        createdBy: req.user._id,
      };
      var newvalues = { $set: { type: req.body.type } };
      isLike = 2;
      CollectionLike.updateOne(myquery, newvalues, function (err, res) {
        if (err) throw err;
      });
    }
  } else {
    isLike = 3;
    post = new CollectionLike({
      collectionId: req.body.collectionId,
      type: req.body.type,
      createdBy: req.user._id,
      creationDate: Date.now(),
    });

    await post.save();
  }
  return res.send({
    // _id: post._id,
    isLike: isLike,
    message: "Liked Successfully",
  });
};

module.exports.createCollectionLike = createCollectionLike;

const createBookMark = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status("400").send({ error: "Bad Request" });

  const post = await Post.findById(req.params.post_id);
  if (!post) return res.status("400").send({ error: "Bad Request" });

  if (!post.bookMarkedBy) {
    post.bookMarkedBy = [];
  }
  if (!user.postsBookmarked) {
    user.postsBookmarked = [];
  }
  await post.bookMarkedBy.push(`${req.user._id}`);
  await user.postsBookmarked.push(req.params.post_id);
  await post.save();
  await user.save();
  res.send({ message: "Post Bookmarked Successfully" });
};

module.exports.createBookMark = createBookMark;

const createBookClubBookMark = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status("400").send({ error: "Bad Request" });

  const post = await BookClubPost.findById(req.params.post_id);
  if (!post) return res.status("400").send({ error: "Bad Request" });

  if (!post.bookMarkedBy) {
    post.bookMarkedBy = [];
  }
  if (!user.postsBookmarked) {
    user.postsBookmarked = [];
  }
  await post.bookMarkedBy.push(`${req.user._id}`);
  await user.postsBookmarked.push(req.params.post_id);
  await post.save();
  await user.save();
  res.send({ message: "Post Bookmarked Successfully" });
};

module.exports.createBookClubBookMark = createBookClubBookMark;

const deleteBookMark = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status("400").send({ error: "Bad Request" });

  const post = await Post.findOne({
    _id: req.params.post_id,
    bookMarkedBy: { $in: [`${req.user._id}`] },
  });
  if (!post) return res.status("400").send({ error: "Bad Request" });

  const tempArray1 = post.bookMarkedBy.filter((id) => id != req.user._id);
  post.bookMarkedBy = tempArray1;
  const tempArray2 = user.postsBookmarked.filter(
    (id) => id != req.params.post_id
  );
  user.postsBookmarked = tempArray2;
  await post.save();
  await user.save();

  res.send({ message: "Post Unbookmarked Successfully" });
};

module.exports.deleteBookMark = deleteBookMark;

const deleteBookClubBookMark = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status("400").send({ error: "Bad Request" });

  const post = await BookClubPost.findOne({
    _id: req.params.post_id,
    bookMarkedBy: { $in: [`${req.user._id}`] },
  });
  if (!post) return res.status("400").send({ error: "Bad Request" });

  const tempArray1 = post.bookMarkedBy.filter((id) => id != req.user._id);
  post.bookMarkedBy = tempArray1;
  const tempArray2 = user.postsBookmarked.filter(
    (id) => id != req.params.post_id
  );
  user.postsBookmarked = tempArray2;
  await post.save();
  await user.save();

  res.send({ message: "Post Unbookmarked Successfully" });
};

module.exports.deleteBookClubBookMark = deleteBookClubBookMark;

const searchResult = async (req, res) => {
  if (req.query.type == "") {
    let postFind = await Post.find({
      status: "active",
      type: "post",
      description: { $regex: req.query.search, $options: "i" },
      createdBy: { $nin: req.user.usersBlocked },
    });
    let questionFind = await Post.find({
      status: "active",
      type: "question",
      description: { $regex: req.query.search, $options: "i" },
      createdBy: { $nin: req.user.usersBlocked },
    });
    let eventFind = await EventDetails.find({
      name: { $regex: req.query.search, $options: "i" },
      date: { $gt: Date.now() },
    });
    let classFind = await ClassDetails.find({
      name: { $regex: req.query.search, $options: "i" },
      date: { $gt: Date.now() },
    });
    return res.send({
      postList: postFind,
      questionList: questionFind,
      eventList: eventFind.concat(classFind),
    });
  }
};

module.exports.searchResult = searchResult;

const createBlog = async (req, res) => {
  blog = new Blog({
    description: req.body.description,
    link: req.body.link,
    status: "active",
    createdBy: req.user._id,
    creationDate: Date.now(),
  });
  await blog.save();

  return res.send({
    _id: blog._id,
    message: "Data Successfully Posted",
  });
};

module.exports.createBlog = createBlog;

const editBlog = async (req, res) => {
  let user = await Blog.findById(req.params.id);
  //edit details
  user.description = req.body.description;
  user.link = req.body.link;

  await user.save();

  return res.send({ message: "Blog Updated Successfully" });
};

module.exports.editBlog = editBlog;

const deleteBlog = async (req, res) => {
  let user = await Blog.findById(req.params.id);
  //edit details

  await user.delete();

  return res.send({ message: "Blog Deleted Successfully" });
};

module.exports.deleteBlog = deleteBlog;

const blogList = async (req, res) => {
  postData = await Blog.find({
    createdBy: req.user._id,
    status: "active",
  }).populate("createdBy");
  //edit details

  return res.send({
    blogList: postData,
  });
};

module.exports.blogList = blogList;

const otherPostList = async (req, res) => {
  const id = req.params.id;
  const type = req.params.type;
  list = await Post.find({
    status: "active",
    type: req.params.type == "post" ? "post" : "question",
    //createdBy: { $nin: req.user.usersBlocked },
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
          req.query.search
            ? { description: { $regex: req.query.search, $options: "i" } }
            : {},
          req.query.type ? { createdBy: mongoose.Types.ObjectId(id) } : {},
          { type: type == "post" ? "post" : "question" },
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
          //{ $skip: req.query.page == 1 ? 0 : (req.query.page - 1) * 3 },
          // { $limit: 3 },
        ], // add projection here wish you re-shape the docs
      },
    },
  ]).exec(function (err, transactions) {
    if (err) throw err;
    for (const post of transactions[0].data) {
      if (req.user.usersBlocked.includes(post.createdBy._id))
        transactions[0].data.splice(
          transactions[0].data.findIndex(
            (x) => x.createdBy._id === post.createdBy._id
          ),
          1
        );
    }
    User.populate(
      transactions[0].data,
      { path: "createdBy" },
      function (err, populatedTransactions) {
        //
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

module.exports.otherPostList = otherPostList;

const otherCollectionList = async (req, res) => {
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
                mongoose.Types.ObjectId(req.params.id),
                "$likeList.createdBy",
              ],
            },
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
          //{ $skip: req.query.page == 1 ? 0 : (req.query.page - 1) * 3 },
          // { $limit: 3 },
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

module.exports.otherCollectionList = otherCollectionList;

const reportPost = async (req, res) => {
  const user = await Report.find({
    postId: req.params.postId,
    reportedBy: mongoose.Types.ObjectId(req.user._id),
  }).count();
  if (user > 0)
    return res.send({
      message: "Post Already Reported",
    });
  let report = new Report({
    reason: req.body.reason,
    reportedBy: mongoose.Types.ObjectId(req.user._id),
    postId: req.params.postId,
    creationDate: Date.now(),
  });
  await report.save();

  return res.send({
    message: "Post Reported Successfully",
  });
};

module.exports.reportPost = reportPost;

const blockUser = async (req, res) => {
  let user = await User.findById(req.user._id);
  if (req.params.id == req.user._id)
    return res.send({
      message: "Can't Block",
    });
  if (user.usersBlocked.includes(req.params.id))
    return res.send({
      message: "User Already Blocked",
    });
  user.usersBlocked.push(req.params.id);
  await user.save();
  return res.send({
    message: "User Blocked Successfully",
  });
};

module.exports.blockUser = blockUser;

const otherBlogList = async (req, res) => {
  postData = await Blog.find({
    createdBy: req.params.id,
    status: "active",
  }).populate("createdBy");
  //edit details

  return res.send({
    blogList: postData,
  });
};

module.exports.otherBlogList = otherBlogList;

const editPost = async (req, res) => {
  let post;
  if (req.body.model === "bookClubPost")
    post = await BookClubPost.findById(req.body.id);
  else post = await Post.findById(req.body.id);
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
    message:
      post.type === "post"
        ? `Post Edited Successfully`
        : `Question Edited Successfully`,
  });
};

module.exports.editPost = editPost;

const upload = async (file) => {};
