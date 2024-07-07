const ROLES_LIST = require("../config/roles_list");

const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req?.roles) return res.sendStatus(401);
    const rolesArray = [...allowedRoles];
    const result = req.roles
      .map((role) => rolesArray.includes(role))
      .find((val) => val === true);

    req.isAdmin = req.roles.includes(ROLES_LIST.Admin);

    if (!result) return res.sendStatus(401);
    next();
  };
};

module.exports = verifyRoles;
