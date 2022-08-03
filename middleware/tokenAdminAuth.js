const jwt = require("jsonwebtoken");
const config = require("config");
function tokenAdminAuthorisation(req, res, next) {
  const token = req.header("x-auth-token-admin");
  if (!token)
    return res.status(401).send({ error: "Access Denied. No token provided." });
  try {
    const decoded = jwt.verify(token, config.get("jwtprivatekey"));
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send({ error: "You are not Authenticated Yet" });
  }
}

module.exports = tokenAdminAuthorisation;
