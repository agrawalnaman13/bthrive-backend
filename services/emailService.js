const nodemailer = require("nodemailer");
const config = require("config");

const sendMail = async (receiverEmailId, subjectOfMail, textOfmail) => {
  const transporter = nodemailer.createTransport({
    service: config.get("mailserverhost"),
    auth: {
      user: config.get("mailserverid"),
      pass: config.get("mailserverpassword"),
    },
  });

  const mailOptions = {
    from: config.get("mailserverid"),
    to: receiverEmailId,
    subject: subjectOfMail,
    text: textOfmail,
  };
  await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = sendMail;
