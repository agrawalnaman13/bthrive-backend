const formidable = require("formidable");
var fs = require("fs");
const path = require("path");
const fileUpload = (req, dirPath, fileName) => {
  let form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    let oldPath = files[fileName].path;
    let newPath = `${dirPath}/${req.user.id}/${files.myFile.name}`;
    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(`${dirPath}/${req.user.id}`);
    }
    let rawData = fs.readFileSync(oldPath);
    fs.writeFile(newPath, rawData, function (err) {
      if (err) console.log(err);
      fs.unlinkSync(oldPath);
      return newPath;
    });
  });
};

module.exports = fileUpload;
