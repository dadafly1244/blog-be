const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const ROLES_LIST = require("../../config/roles_list");
const verifyJWT = require("../../middleware/verifyJWT");
const categoryController = require("../../controllers/categoryController");
const isAdminOrBlogOwner = require("../../middleware/isAdminOrBlogOwner");
const [Admin, , User] = ROLES_LIST;
// Category routes
router.use(verifyJWT);

// 카테고리 생성
router.post(
  "/:blogOwnerId",
  verifyRoles(Admin, User),
  isAdminOrBlogOwner,
  categoryController.createCategory
);

router
  .put(
    "/:blogOwnerId/:categoryId",
    isAdminOrBlogOwner,
    categoryController.updateCategory
  )
  .delete(isAdminOrBlogOwner, categoryController.deleteCategory);

// 카테고리 조회 (모든 사용자가 접근 가능)
router.get("/categories", categoryController.getAllCategories);

module.exports = router;
