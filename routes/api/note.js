const express = require("express");
const router = express.Router();
const notesController = require("../../controllers/notesController");
const verifyJWT = require("../../middleware/verifyJWT");
const verifyRoles = require("../../middleware/verifyRoles");
const ROLES_LIST = require("../../config/roles_list");
const [Admin, Editor] = ROLES_LIST;

router.use(verifyJWT);

router
  .route("/")
  .get(notesController.getAllNotes)
  .post(notesController.createNewNote);
router
  .route("/:id")
  .get(notesController.getNote)
  .patch(notesController.updateNote)
  .delete(verifyRoles(Admin, Editor), notesController.deleteNote);
router.get("/category/:category", notesController.getNotesByCategory);

module.exports = router;
