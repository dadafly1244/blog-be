const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 회원가입 API
const handleNewUser = async (req, res) => {
  const { user, pwd, roles, status, profile } = req.body;

  // 필수 입력 항목 검증
  if (!user || !pwd || !profile || !profile.bio) {
    return res.status(400).json({
      message: "user, pwd, and bio are required.",
    });
  }

  //console.log(user, pwd, profile);
  console.log("rolelist", roles);
  try {
    // 중복 사용자 검증
    const duplicateCount = await User.countDocuments({ user: user });
    if (duplicateCount > 0) {
      return res.status(409).json({ message: "user already exists." }); // Conflict
    }

    // 비밀번호 암호화
    const hashedPwd = await bcrypt.hash(pwd, 10);
    // accessToken 생성 (짧은 만료 시간)
    const accessToken = jwt.sign(
      {
        UserInfo: {
          user: user,
          roles: roles,
          status: status,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // refreshToken 생성 (긴 만료 시간)
    const refreshToken = jwt.sign(
      { user: user },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    // refreshToken을 쿠키에 설정
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 60 * 1000, //7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // 프로필 정보 초기화
    const profileData = {
      firstName: profile?.firstName || "당신의 성을 알고 싶어요.",
      lastName: profile?.lastName || "이름 없는 당신",
      gender: profile?.gender || "prefer not to say",
      birthDate: profile?.birthDate || "",
      bio: profile.bio,
      status: status || "inActive",
      avatar: profile?.avatar || "",
      location: profile?.location || "",
      website: profile?.website || "",
      socialLinks: {
        facebook: profile.socialLinks?.facebook || "",
        twitter: profile.socialLinks?.twitter || "",
        instagram: profile.socialLinks?.instagram || "",
        linkedin: profile.socialLinks?.linkedin || "",
      },
    };

    // 새 사용자 생성 및 저장
    const newUser = await User.create({
      user: user,
      pwd: hashedPwd,
      roles: roles,
      profile: profileData,
      refreshToken: [refreshToken],
    });

    console.log("newUser", newUser);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 60 * 1000, //7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: `New user ${user} created!`,
      accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { handleNewUser };
