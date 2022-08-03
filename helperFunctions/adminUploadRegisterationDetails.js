const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: "AKIAZEB4U57ODQNELTUN",
  secretAccessKey: "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",
  Bucket: "bthrivecommunity-media",
});

function createAdminUploadPathRegistrationDetails(req, res, next) {
  // fs.exists(`./public/Documents/admin/interest`, function (exists) {
  //   if (exists) {
  //     next();
  //   } else {
  //     fs.mkdir(
  //       `./public/Documents/admin/interest`,
  //       { recursive: true },
  //       function (err) {
  //         if (err) {
  //           next();
  //         }
  //         next();
  //       }
  //     );
  //   }
  // });
  next();
}
module.exports.createAdminUploadPathRegistrationDetails =
  createAdminUploadPathRegistrationDetails;

var adminUploadRegistrationDetails = multer({
  storage: multerS3({
    s3: s3,
    acl: "public-read",
    bucket: "bthrivecommunity-media",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      let extArray = file.mimetype.split("/");
      let ext = extArray[extArray.length - 1];
      console.log(`ext ->> `, ext, ` file.fieldname ->> `, file.fieldname);
      cb(null, `admin/interest/` + Date.now().toString() + "." + ext);
    },
  }),
});

module.exports.adminUploadRegistrationDetails = adminUploadRegistrationDetails;
