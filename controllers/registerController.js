const { ROLES_LIST } = require("../config/roles_list");

const User = require("../model/User");
const bcrypt = require("bcrypt");

// 회원가입 API
const handleNewUser = async (req, res) => {
  const { user, pwd, profile } = req.body;
  if (!user || !pwd)
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  if (!bio) return res.status(400).json({ message: "Bio is required" });

  // check for duplicate usernames in the db
  const duplicate = await User.findOne({ username: user }).exec();
  if (duplicate) return res.sendStatus(409); //Conflict

  try {
    //encrypt the password
    const hashedPwd = await bcrypt.hash(pwd, 10);

    //create and store the new user
    const result = await User.create({
      username: user,
      password: hashedPwd,
      roles: ROLES_LIST.includes(req.body?.roles)
        ? ROLES_LIST[req.body?.roles]
        : ROLES_LIST["User"],
      profile: {
        firstName: profile?.firstName || "당신의 성을 알고 싶어요.",
        lastName: profile?.lastName || "이름 없는 당신",
        gender: profile?.gender || "prefer not to say",
        birthDate: profile.birthDate || "",
        bio: profile?.bio,
        status: req.body?.status || "inActive",
        avatar: profile?.avatar, // URL to avatar image
        location: profile?.location || "",
        website: profile?.website || "",
        socialLinks: {
          facebook: profile.socialLinks?.facebook || "",
          twitter: profile.socialLinks?.twitter || "",
          instagram: profile.socialLinks?.instagram || "",
          linkedin: profile.socialLinks?.linkedin || "",
        },
      },
    });

    console.log(result);

    res.status(201).json({ success: `New user ${user} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
