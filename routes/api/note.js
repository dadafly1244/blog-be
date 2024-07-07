const express = require("express");
const router = express.Router();
const notesController = require("../../controllers/notesController");
const verifyJWT = require("../../middleware/verifyJWT");
const verifyRoles = require("../../middleware/verifyRoles");
const ROLES_LIST = require("../../config/roles_list");
router.use(verifyJWT);

router
  .route("/")
  .get(notesController.getAllNotes)
  .post(notesController.createNewNote);
router
  .route("/:id")
  .get(notesController.getNote)
  .patch(notesController.updateNote)
  .delete(
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor),
    notesController.deleteNote
  );
router.get("/category/:category", notesController.getNotesByCategory);

module.exports = router;
