const express = require("express");
const router = express.Router();
const commentsController = require("../../controllers/commentController");
const verifyJWT = require("../../middleware/verifyJWT");
const verifyRoles = require("../../middleware/verifyRoles");
const ROLES_LIST = require("../../config/roles_list");

router.use(verifyJWT);

// Comments routes
router
  .route("/")
  .get(commentsController.getAllComments)
  .post(
    verifyRoles(ROLES_LIST.User, ROLES_LIST.Editor),
    commentsController.createNewComment
  );

router
  .route("/:id")
  .patch(
    verifyRoles(ROLES_LIST.User, ROLES_LIST.Editor),
    commentsController.updateComment
  )
  .delete(
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.User, ROLES_LIST.Editor),
    commentsController.deleteComment
  );

router.route("/note/:noteId").get(commentsController.getCommentsByNoteId);

router.route("/:id/replies").get(commentsController.getReplies);

module.exports = router;
