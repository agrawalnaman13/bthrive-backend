function adminAuthorisation(req, res, next) {
  if (!req.user.isAdmin)
    return res.status(403).send({ error: "Access Denied" });
  next();
}

module.exports = adminAuthorisation;
