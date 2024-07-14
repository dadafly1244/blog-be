const express = require("express");
const router = express.Router();
const commentsController = require("../../controllers/commentController");
const verifyJWT = require("../../middleware/verifyJWT");
const verifyRoles = require("../../middleware/verifyRoles");
const ROLES_LIST = require("../../config/roles_list");
const [Admin, Editor, User] = ROLES_LIST;

router.use(verifyJWT);

// Comments routes
router
  .route("/")
  .get(commentsController.getAllComments)
  .post(verifyRoles(User, Editor), commentsController.createNewComment);

router
  .route("/:id")
  .patch(verifyRoles(User, Editor), commentsController.updateComment)
  .delete(verifyRoles(Admin, User, Editor), commentsController.deleteComment);

router.route("/note/:noteId").get(commentsController.getCommentsByNoteId);

router.route("/:id/replies").get(commentsController.getReplies);

module.exports = router;
