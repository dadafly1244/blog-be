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
      .select("-password") // Exclude password from the result
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
  const { username, password, roles, profile } = req.body;

  // Confirm data
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  // Check for duplicate username
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

  // Prepare user object
  const userObject = {
    username,
    password: hashedPwd,
    roles: roles || { User: 2001 }, // Default role if not provided
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
      res.status(201).json({ message: `New user ${username} created` });
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

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: `User with ID ${id} not found` });
    }

    await user.remove();

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

    const user = await User.findById(id).select("-password").lean();

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
    const { username, email, roles } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID required" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: `User with ID ${id} not found` });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (roles) user.roles = roles;

    const updatedUser = await user.save();

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

    const user = await User.findById(id).select("-password -refreshToken");
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

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update profile fields
    user.profile = {
      ...user.profile,
      firstName: firstName || user.profile.firstName,
      lastName: lastName || user.profile.lastName,
      gender: gender || user.profile.gender,
      birthDate: birthDate || user.profile.birthDate,
      bio: bio || user.profile.bio,
      status: status || user.profile.status,
      location: location || user.profile.location,
      website: website || user.profile.website,
      socialLinks: {
        ...user.profile.socialLinks,
        ...socialLinks,
      },
    };

    const updatedUser = await user.save();

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc Change user password
// @route PATCH /users/:id/change-password
// @access Private
const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // 요청한 사용자가 비밀번호를 변경하려는 계정의 소유자인지 확인
    if (req.user.id !== id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // 새 비밀번호 해시
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.json({ message: "Password changed successfully" });
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

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 이전 아바타가 있다면 삭제
    if (user.profile.avatar) {
      await gfs.delete(new mongoose.Types.ObjectId(user.profile.avatar));
    }

    // 새 아바타 파일 ID 저장
    user.profile.avatar = req.file.id;
    await user.save();

    res.json({
      message: "Avatar uploaded successfully",
      avatarId: user.profile.avatar,
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
      _id: new mongoose.Types.ObjectId(user.profile.avatar),
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
  changePassword,
  uploadAvatar,
  getAvatar,
};
