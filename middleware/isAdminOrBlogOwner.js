const ROLES_LIST = require("../config/roles_list");

const [Admin, ,] = ROLES_LIST;

const isAdminOrBlogOwner = (req, res, next) => {
  if (req.body?.roles === Admin || req.user.id === req.params.id) {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied. Admin or blog owner required." });
  }
};

module.exports = isAdminOrBlogOwner;
