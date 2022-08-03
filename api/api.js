const express = require("express");
const adminRoutes = require("../routes/adminRoutes");
const { Admin } = require("../models/adminSchema");
const mongoose = require("mongoose");
const router = express.Router();
const {
  createPrimaryUser,
  createAdmin,
  userAuthentication,
  otpGeneration,
  otpVerification,
  resetPassword,
  setUpProfile,
  saveInterest,
  tokenCheck,
  myData,
  changePassword,
  editProfile,
  createInterest,
  deleteInterest,
  getInterest,
  myInterest,
  trendingInterest,
  contactUs,
  feedback,
  addInterestInUser,
  getClasses,
  getEvents,
  deleteInterestInUser,
  bloggerData,
  bloggersProfileData,
  notification,
  logout,
  deactivate,
  attendEventOrClass,
  becomeAHost,
  getHost,
  followBookClub,
  UserPanellearnWithBthrivePostList,
  createUserWithGoogle,
  createUserWithLinkedin,
  readNotification,
  getStart,
  getBookClubData,
} = require("../controllers/userControllers");
const {
  createPost,
  createBookClubPost,
  postList,
  myPostList,
  commentList,
  postDetail,
  createComment,
  createLike,
  approveInsight,
  createCollection,
  collectionList,
  collectionDetail,
  addPostToCollection,
  likeList,
  collectionLikeList,
  createCollectionLike,
  searchResult,
  createBlog,
  editBlog,
  deleteBlog,
  blogList,
  createBookMark,
  deleteBookMark,
  bookClubPostList,
  createBookClubBookMark,
  deleteBookClubBookMark,
  otherPostList,
  otherCollectionList,
  reportPost,
  blockUser,
  otherBlogList,
  editPost,
  removePostFromCollection,
  deleteMyCollection,
  deleteMyPost,
  bookmarkBookClubPostList,
  bookmarkPostList,
} = require("../controllers/postController");
const tokenAuthorisation = require("../middleware/tokenAuth");
const tokenAdminAuthorisation = require("../middleware/tokenAdminAuth");
const {
  createUploadPathRegistrationDetails,
  uploadRegistrationDetails,
} = require("../helperFunctions/uploadRegistrationDetails");
const {
  createAdminUploadPathRegistrationDetails,
  adminUploadRegistrationDetails,
} = require("../helperFunctions/adminUploadRegisterationDetails");
router.get("/", function (res) {
  res.send("welcome to b-thrive api");
});
router.post("/register", createPrimaryUser);
router.post("/auth/google", createUserWithGoogle);
router.post("/auth/linkedin", createUserWithLinkedin);
router.post(
  "/createAdmin",
  createAdminUploadPathRegistrationDetails,
  adminUploadRegistrationDetails.any(),
  createAdmin
);
router.post(
  "/createInterest",
  tokenAdminAuthorisation,
  createAdminUploadPathRegistrationDetails,
  adminUploadRegistrationDetails.any(),
  createInterest
);
router.get("/addInterestInUser/:id", tokenAuthorisation, addInterestInUser);
router.get(
  "/deleteInterestInUser/:id",
  tokenAuthorisation,
  deleteInterestInUser
);
router.post("/login", userAuthentication);
router.post("/otpGeneration", otpGeneration);
router.post("/forgotPassword", otpGeneration);
router.post("/otpVerification", otpVerification);
router.post("/contactUs", contactUs);
router.post("/feedback", tokenAuthorisation, feedback);
router.post(
  "/setUpProfile",
  tokenAuthorisation,
  createUploadPathRegistrationDetails,
  uploadRegistrationDetails.any(),
  setUpProfile
);
router.post("/saveInterest", tokenAuthorisation, saveInterest);
router.delete("/deleteInterest/:id", tokenAuthorisation, deleteInterest);
router.get("/myData", tokenAuthorisation, myData);
router.post("/saveInterest", tokenAuthorisation, saveInterest);
router.get("/myInterest", tokenAuthorisation, myInterest);
router.get("/trendingInterest", trendingInterest);
router.get("/getInterest", getInterest);
router.get("/trendingInterest", tokenAuthorisation, trendingInterest);
router.post(
  "/editProfile",
  tokenAuthorisation,
  createUploadPathRegistrationDetails,
  uploadRegistrationDetails.any(),
  editProfile
);
router.post("/tokenCheck", tokenAuthorisation, tokenCheck);
router.post("/resetPassword", tokenAuthorisation, resetPassword);
router.post("/changePassword", tokenAuthorisation, changePassword);
router.get("/termsConditions", async (req, res) => {
  const data = await Admin.findOne().select(
    "termsConditions ourPolicy customerPaymentPolicy -_id"
  );
  res.send(data);
});
router.post(
  "/createPost",
  tokenAuthorisation,
  uploadRegistrationDetails.array("files", 3),
  createPost
);
router.get("/deletePost/:id", tokenAuthorisation, deleteMyPost);
router.post(
  "/createBookClubPost",
  tokenAuthorisation,
  createUploadPathRegistrationDetails,
  uploadRegistrationDetails.any(),
  createBookClubPost
);
router.post("/createBlog", tokenAuthorisation, createBlog);
router.post("/editBlog/:id", tokenAuthorisation, editBlog);
router.post("/deleteBlog/:id", tokenAuthorisation, deleteBlog);
router.get("/blogList", tokenAuthorisation, blogList);
router.get("/post/:type", tokenAuthorisation, postList);
router.get("/bookClubPost/:type", tokenAuthorisation, bookClubPostList);
router.get("/otherpost/:id/:type", tokenAuthorisation, otherPostList);
router.get("/myPostList", tokenAuthorisation, myPostList);
router.get("/comment/:id/:type", tokenAuthorisation, commentList);
router.get("/post-detail/:id", tokenAuthorisation, postDetail);
router.post("/createComment/:typeOfPost", tokenAuthorisation, createComment);
router.post("/createLike/:typeOfPost", tokenAuthorisation, createLike);
router.post("/updateCommentStatus", tokenAuthorisation, approveInsight);
router.post(
  "/createCollection",
  tokenAuthorisation,
  createUploadPathRegistrationDetails,
  uploadRegistrationDetails.any(),
  createCollection
);
router.get("/deleteCollection/:id", tokenAuthorisation, deleteMyCollection);
router.get("/collectionList", tokenAuthorisation, collectionList);
router.get("/otherCollectionList/:id", tokenAuthorisation, otherCollectionList);
router.get("/collection-detail/:id", tokenAuthorisation, collectionDetail);
router.post("/addPostToCollection", tokenAuthorisation, addPostToCollection);
router.post(
  "/removePostFromCollection",
  tokenAuthorisation,
  removePostFromCollection
);
router.get("/likeList", likeList);
router.get("/collectionLikeList", collectionLikeList);
router.post("/createCollectionLike", tokenAuthorisation, createCollectionLike);
router.post("/createBookMark/:post_id", tokenAuthorisation, createBookMark);
router.post(
  "/createBookClubBookMark/:post_id",
  tokenAuthorisation,
  createBookClubBookMark
);
router.post("/deleteBookMark/:post_id", tokenAuthorisation, deleteBookMark);
router.post(
  "/deleteBookClubBookMark/:post_id",
  tokenAuthorisation,
  deleteBookClubBookMark
);
router.get("/searchResult", tokenAuthorisation, searchResult);
router.get("/getClasses", tokenAuthorisation, getClasses);
router.get("/getEvents", tokenAuthorisation, getEvents);
router.get("/bloggers", tokenAuthorisation, bloggerData);
router.get("/bloggersProfile/:id", tokenAuthorisation, bloggersProfileData);
router.get("/notification", tokenAuthorisation, notification);
router.get("/logout", tokenAuthorisation, logout);
router.post("/reportPost/:postId", tokenAuthorisation, reportPost);
router.get("/blockUser/:id", tokenAuthorisation, blockUser);
router.get("/deactivate", tokenAuthorisation, deactivate);
router.get("/attendEvent/:id/:type", tokenAuthorisation, attendEventOrClass);
router.post(
  "/becomeAHost",
  tokenAuthorisation,
  createUploadPathRegistrationDetails,
  uploadRegistrationDetails.any(),
  becomeAHost
);
router.get("/getHost", tokenAuthorisation, getHost);
router.get("/follow/:id", tokenAuthorisation, followBookClub);
router.get(
  "/learnWithBthrivePost/:type",
  tokenAuthorisation,
  UserPanellearnWithBthrivePostList
);
router.get("/otherBlogList/:id", tokenAuthorisation, otherBlogList);
router.post(
  "/editPost",
  tokenAuthorisation,
  createUploadPathRegistrationDetails,
  uploadRegistrationDetails.any(),
  editPost
);
router.get("/read/:id", tokenAuthorisation, readNotification);
router.post("/getStart", getStart);
router.post(
  "/bookmarkBookClubPostList/:type",
  tokenAuthorisation,
  bookmarkBookClubPostList
);
router.post("/bookmarkPostList/:type", tokenAuthorisation, bookmarkPostList);
router.get("/getBookClubData", tokenAuthorisation, getBookClubData);
router.use("/admin", adminRoutes);
router.delete("/deleteCollections", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    collections
      .map((collection) => collection.name)
      .forEach(async (collectionName) => {
        db.dropCollection(collectionName);
      });

    res.status(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});
router.post("/deleteCollection", async (req, res) => {
  try {
    const db = mongoose.connection.db;

    db.dropCollection(req.body.collectionName);

    res.status(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});
module.exports = router;
