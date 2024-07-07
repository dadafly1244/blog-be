const isAdminOrBlogOwner = (req, res, next) => {
  if (
    req.user.roles.includes(ROLES_LIST.Admin) ||
    req.user.id === req.params.id
  ) {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied. Admin or blog owner required." });
  }
};

module.exports = isAdminOrBlogOwner;
