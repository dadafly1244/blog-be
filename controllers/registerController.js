const { ROLES_LIST } = require("../config/roles_list");
const User = require("../model/User");
const bcrypt = require("bcrypt");

// 회원가입 API
const handleNewUser = async (req, res) => {
  const { user, pwd, profile } = req.body;

  // 필수 입력 항목 검증
  if (!user || !pwd || !profile || !profile.bio) {
    return res.status(400).json({
      message: "Username, password, and bio are required.",
    });
  }

  //console.log(user, pwd, profile);
  console.log("rolelist", req.body);
  try {
    // 중복 사용자 검증
    const duplicateCount = await User.countDocuments({ username: user });
    if (duplicateCount > 0) {
      return res.status(409).json({ message: "Username already exists." }); // Conflict
    }

    // 비밀번호 암호화
    const hashedPwd = await bcrypt.hash(pwd, 10);

    // 프로필 정보 초기화
    const profileData = {
      firstName: profile?.firstName || "당신의 성을 알고 싶어요.",
      lastName: profile?.lastName || "이름 없는 당신",
      gender: profile?.gender || "prefer not to say",
      birthDate: profile?.birthDate || "",
      bio: profile.bio,
      status: req.body?.status || "inActive",
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

    // 사용자 역할 설정
    ROLES_LIST.find((el) => el === role) === !undefined ? role : "dkdkdk";

    // 새 사용자 생성 및 저장
    const newUser = await User.create({
      username: user,
      password: hashedPwd,
      roles: userRole,
      profile: profileData,
    });

    console.log("newUser", newUser);

    res.status(201).json({ success: `New user ${user} created!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { handleNewUser };
