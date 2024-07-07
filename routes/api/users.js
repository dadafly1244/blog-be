const express = require("express");
const router = express.Router();
const usersController = require("../../controllers/usersController");
const ROLES_LIST = require("../../config/roles_list");
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const { upload } = require("../../middleware/gridfsStorage");

// 모든 유저 라우트에 JWT 인증 적용
router.use(verifyJWT);

// 관리자 전용 라우트
router
  .route("/")
  .get(verifyRoles(ROLES_LIST.Admin), usersController.getAllUsers)
  .post(verifyRoles(ROLES_LIST.Admin), usersController.createNewUser);

router
  .route("/:id")
  .get(verifyRoles(ROLES_LIST.Admin), usersController.getUser)
  .patch(verifyRoles(ROLES_LIST.Admin), usersController.updateUser)
  .delete(verifyRoles(ROLES_LIST.Admin), usersController.deleteUser);

// 프로필 관련 라우트 (유저 본인 또는 관리자만 접근 가능)
router
  .route("/:id/profile")
  .get(usersController.getUserProfile)
  .patch(usersController.updateUserProfile);

// 비밀번호 변경 라우트 (유저 본인만 접근 가능)
router.patch("/:id/change-password", usersController.changePassword);

// 프로필 이미지 업로드 라우트
router.post(
  "/:id/upload-avatar",
  verifyRoles(ROLES_LIST.User, ROLES_LIST.Admin),
  upload.single("avatar"), // 'avatar'는 클라이언트에서 보내는 파일 필드의 이름
  usersController.uploadAvatar
);
// 아바타 조회 라우트
router.get("/:id/avatar", usersController.getAvatar);

module.exports = router;
