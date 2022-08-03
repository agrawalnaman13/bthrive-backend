const express = require("express");
const tokenAdminAuthorisation = require("../middleware/tokenAdminAuth");
const adminAuthorisation = require("../middleware/adminAuth");
const {
  adminAuthentication,
  adminData,
  usersData,
  userBlock,
  createEventOrClass,
  createLearnWithBthrivePost,
  learnWithBthrivePostList,
  contactUsData,
  feedBackData,
  usersProfileDetail,
  usersUsage,
  usersActivity,
  changeCollaboration,
  getReports,
  editEventOrClass,
  deleteEventOrClass,
  getHostRequests,
  getHostDetail,
  createHost,
  removeHost,
  adminOtherPostList,
  deletePost,
  adminDeleteInterest,
  AdminGetClasses,
  AdminGetEvents,
  adminOtherCollectionList,
  adminApproveInsight,
  adminCommentList,
  adminOtherBlogList,
  adminPostDetail,
  adminCollectionDetail,
  adminChangePassword,
  adminBookClubPostList,
  graphData,
  deleteLearnWithBthrivePosts,
  editLearnWithBthrivePost,
  adminOtpGeneration,
  adminOtpVerification,
  adminResetPassword,
  getAdmin,
  addZoomLink,
} = require("../controllers/adminControllers");
const {
  createUploadPathEventOrClassDetails,
  uploadEventOrClassDetails,
} = require("../helperFunctions/uploadEvents");
const {
  createUploadLearnWithBthriveDetails,
  uploadLearnWithBthriveDetails,
} = require("../helperFunctions/uploadLearnWithBthrivePost");
const router = express.Router();
router.post("/login", adminAuthentication);
router.post("/forgot-password", adminOtpGeneration);
router.post("/otp-verification", adminOtpVerification);
router.post("/reset-password", adminResetPassword);
router.get(
  "/adminData",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminData
);
router.get(
  "/getAdmin",
  tokenAdminAuthorisation,
  adminAuthorisation,
  getAdmin
);
router.get(
  "/usersData",
  tokenAdminAuthorisation,
  adminAuthorisation,
  usersData
);
router.get(
  "/userBlock/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  userBlock
);
router.post(
  "/createEventOrClass",
  tokenAdminAuthorisation,
  adminAuthorisation,
  createUploadPathEventOrClassDetails,
  uploadEventOrClassDetails.any(),
  createEventOrClass
);
router.post(
  "/createLearnWithBthrivePost",
  tokenAdminAuthorisation,
  adminAuthorisation,
  createUploadLearnWithBthriveDetails,
  uploadLearnWithBthriveDetails.any(),
  createLearnWithBthrivePost
);
router.post(
  "/editLearnWithBthrivePost",
  tokenAdminAuthorisation,
  adminAuthorisation,
  createUploadLearnWithBthriveDetails,
  uploadLearnWithBthriveDetails.any(),
  editLearnWithBthrivePost
);
router.get(
  "/learnWithBthrivepost/:type",
  tokenAdminAuthorisation,
  adminAuthorisation,
  learnWithBthrivePostList
);
router.get(
  "/contactuslist",
  tokenAdminAuthorisation,
  adminAuthorisation,
  contactUsData
);
router.get(
  "/feedbacklist",
  tokenAdminAuthorisation,
  adminAuthorisation,
  feedBackData
);
router.get(
  "/usersProfileDetail/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  usersProfileDetail
);
router.get(
  "/usersUsage/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  usersUsage
);
router.get(
  "/usersActivityList/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  usersActivity
);
router.get(
  "/changeCollaboration/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  changeCollaboration
);
router.get("/reports", tokenAdminAuthorisation, adminAuthorisation, getReports);
router.post(
  "/editEvents/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  editEventOrClass
);
router.get(
  "/deleteEvents/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  deleteEventOrClass
);
router.get(
  "/getHostRequests",
  tokenAdminAuthorisation,
  adminAuthorisation,
  getHostRequests
);
router.get(
  "/getHostDetail/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  getHostDetail
);
router.get(
  "/createHost/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  createHost
);
router.get(
  "/removeHost/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  removeHost
);
router.get(
  "/otherpost/:id/:type",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminOtherPostList
);
router.get(
  "/deletePost/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  deletePost
);
router.get(
  "/deleteLearnWithBthrivePost/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  deleteLearnWithBthrivePosts
);
router.delete(
  "/deleteInterest/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminDeleteInterest
);
router.get(
  "/adminGetClasses",
  tokenAdminAuthorisation,
  adminAuthorisation,
  AdminGetClasses
);
router.get(
  "/adminGetEvents",
  tokenAdminAuthorisation,
  adminAuthorisation,
  AdminGetEvents
);
router.get(
  "/otherCollectionList/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminOtherCollectionList
);
router.post(
  "/updateCommentStatus",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminApproveInsight
);
router.get("/graph", tokenAdminAuthorisation, adminAuthorisation, graphData);
router.get(
  "/comment/:id/:type",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminCommentList
);
router.get(
  "/otherBlogList/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminOtherBlogList
);
router.get(
  "/post-detail/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminPostDetail
);
router.get(
  "/collection-detail/:id",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminCollectionDetail
);
router.post(
  "/changePassword",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminChangePassword
);
router.get(
  "/bookClubPost/:type",
  tokenAdminAuthorisation,
  adminAuthorisation,
  adminBookClubPostList
);

router.post(
  "/addZoomLink",
  tokenAdminAuthorisation,
  adminAuthorisation,
  addZoomLink
);

module.exports = router;