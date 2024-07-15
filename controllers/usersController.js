const User = require("../model/User");
const { gfs } = require("../middleware/gridfsStorage");
const mongoose = require("mongoose");

// Helper function for pagination
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

// @desc Get all users
// @route GET /users
// @access Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);

    const users = await User.find()
      .select("-pwd") // Exclude pwd from the result
      .skip(offset)
      .limit(limit)
      .lean();

    const count = await User.countDocuments();

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json({
      totalItems: count,
      users,
      currentPage: page ? +page : 0,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
  const { user, pwd, roles, profile } = req.body;

  // Confirm data
  if (!user || !pwd) {
    return res.status(400).json({ message: "user and pwd are required" });
  }

  // Check for duplicate user
  const duplicate = await User.findOne({ user })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate user" });
  }

  // Hash pwd
  const hashedPwd = await bcrypt.hash(pwd, 10); // salt rounds

  // Prepare user object
  const userObject = {
    user,
    pwd: hashedPwd,
    roles: ROLES_LIST.includes(req.body?.roles) ? req.body?.roles : "User", // Default role if not provided
    profile: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      gender: profile?.gender || "prefer not to say",
      birthDate: profile?.birthDate || null,
      bio: profile?.bio || "",
      status: profile?.status || "active",
      avatar: profile?.avatar || "",
      location: profile?.location || "",
      website: profile?.website || "",
      socialLinks: {
        facebook: profile?.socialLinks?.facebook || "",
        twitter: profile?.socialLinks?.twitter || "",
        instagram: profile?.socialLinks?.instagram || "",
        linkedin: profile?.socialLinks?.linkedin || "",
      },
    },
  };

  // Create and store new user
  try {
    const user = await User.create(userObject);

    if (user) {
      res.status(201).json({ message: `New user ${user} created` });
    } else {
      res.status(400).json({ message: "Invalid user data received" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a user
// @route DELETE /users/:id
// @access Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID required" });
    }

    const findUser = await User.findById(id);

    if (!findUser) {
      return res.status(404).json({ message: `User with ID ${id} not found` });
    }

    await findUser.remove();

    res.json({ message: `User with ID ${id} deleted successfully` });
  } catch (error) {
    next(error);
  }
};

// @desc Get a single user
// @route GET /users/:id
// @access Private (Admin only)
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID required" });
    }

    const user = await User.findById(id).select("-pwd").lean();

    if (!user) {
      return res.status(404).json({ message: `User with ID ${id} not found` });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc Update a user
// @route PATCH /users/:id
// @access Private (Admin only)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user, email, roles } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID required" });
    }

    const findUser = await User.findById(id);

    if (!findUser) {
      return res.status(404).json({ message: `User with ID ${id} not found` });
    }

    if (user) user.user = user;
    if (email) user.email = email;
    if (roles) user.roles = roles;

    const updatedUser = await findUser.save();

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

const bcrypt = require("bcrypt");
const ROLES_LIST = require("../config/roles_list");

// 기존 함수들은 그대로 유지...

// @desc Get user profile
// @route GET /users/:id/profile
// @access Private
const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 요청한 사용자가 프로필 소유자이거나 관리자인지 확인
    if (req.user.id !== id && !req.user.roles.includes(ROLES_LIST.Admin)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(id).select("-pwd -refreshToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc Update user profile
// @route PATCH /users/:id/profile
// @access Private
const updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      gender,
      birthDate,
      bio,
      status,
      location,
      website,
      socialLinks,
    } = req.body;

    // 요청한 사용자가 프로필 소유자이거나 관리자인지 확인
    if (req.user.id !== id && !req.user.roles.includes(ROLES_LIST.Admin)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const findUser = await User.findById(id);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update profile fields
    findUser.profile = {
      ...findUser.profile,
      firstName: firstName || findUser.profile.firstName,
      lastName: lastName || findUser.profile.lastName,
      gender: gender || findUser.profile.gender,
      birthDate: birthDate || findUser.profile.birthDate,
      bio: bio || findUser.profile.bio,
      status: status || findUser.profile.status,
      location: location || findUser.profile.location,
      website: website || findUser.profile.website,
      socialLinks: {
        ...findUser.profile.socialLinks,
        ...socialLinks,
      },
    };

    const updatedUser = await findUser.save();

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc Change user pwd
// @route PATCH /users/:id/change-pwd
// @access Private
const changePwd = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPwd, newPwd } = req.body;

    // 요청한 사용자가 비밀번호를 변경하려는 계정의 소유자인지 확인
    if (req.user.id !== id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const findUser = await User.findById(id);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPwd, findUser.pwd);
    if (!isMatch) {
      return res.status(400).json({ message: "Current pwd is incorrect" });
    }

    // 새 비밀번호 해시
    const hashedPwd = await bcrypt.hash(newPwd, 10);
    findUser.pwd = hashedPwd;

    await findUser.save();

    res.json({ message: "Pwd changed successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc Upload avatar
// @route POST /users/:id/upload-avatar
// @access Private
const uploadAvatar = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 요청한 사용자가 프로필 소유자이거나 관리자인지 확인
    if (req.user.id !== id && !req.user.roles.includes(ROLES_LIST.Admin)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const findUser = await User.findById(id);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 이전 아바타가 있다면 삭제
    if (findUser.profile.avatar) {
      await gfs.delete(
        new mongoose.isObjectIdOrHexString(findUser.profile.avatar)
      );
    }

    // 새 아바타 파일 ID 저장
    findUser.profile.avatar = req.file.id;
    await findUser.save();

    res.json({
      message: "Avatar uploaded successfully",
      avatarId: findUser.profile.avatar,
    });
  } catch (error) {
    next(error);
  }
};

const getAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.profile.avatar) {
      return res.status(404).json({ message: "Avatar not found" });
    }

    const file = await gfs.files.findOne({
      _id: new ObjectId.createFromHexString(user.profile.avatar),
    });
    if (!file) {
      return res.status(404).json({ message: "Avatar not found" });
    }

    const readStream = gfs.openDownloadStream(file._id);
    readStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  createNewUser,
  deleteUser,
  getUser,
  updateUser,
  getUserProfile,
  updateUserProfile,
  changePwd,
  uploadAvatar,
  getAvatar,
};
