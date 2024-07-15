const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  const cookies = req.cookies;

  const { user, pwd } = req.body;
  if (!user || !pwd)
    return res.status(400).json({ message: "user and pwd are required." });

  const foundUser = await User.findOne({ user: user }).exec();
  if (!foundUser) return res.sendStatus(401); //Unauthorized

  // evaluate pwd
  const match = await bcrypt.compare(pwd, foundUser.pwd);
  if (match) {
    const roles = foundUser.roles;
    const status = foundUser.profile.status;

    console.log("status", roles);

    // create JWTs
    const accessToken = jwt.sign(
      {
        UserInfo: {
          user: foundUser.user,
          roles: roles,
          status: status,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10m" }
    );
    const newRefreshToken = jwt.sign(
      { user: foundUser.user },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    // Update the user's refresh token array
    let newRefreshTokenArray = !cookies?.jwt
      ? foundUser.refreshToken
      : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

    newRefreshTokenArray.push(newRefreshToken);
    foundUser.refreshToken = newRefreshTokenArray;
    await foundUser.save();

    // Create a secure cookie with the new refresh token
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 30 * 60 * 1000,
    });

    // Send authorization roles and access token to user
    res.json({ accessToken });
  } else {
    res.sendStatus(401);
  }
};

// const handleLogin = async (req, res) => {
//   const cookies = req.cookies;

//   const { user, pwd } = req.body;
//   if (!user || !pwd)
//     return res
//       .status(400)
//       .json({ message: "user and pwd are required." });

//   const foundUser = await User.findOne({ user: user }).exec();
//   if (!foundUser) return res.sendStatus(401); //Unauthorized
//   // evaluate pwd
//   const match = await bcrypt.compare(pwd, foundUser.pwd);
//   if (match) {
//     const roles = Object.values(foundUser.roles).filter(Boolean);
//     // create JWTs
//     const accessToken = jwt.sign(
//       {
//         UserInfo: {
//           user: foundUser.user,
//           roles: roles,
//         },
//       },
//       process.env.ACCESS_TOKEN_SECRET,
//       { expiresIn: "10m" }
//     );
//     const newRefreshToken = jwt.sign(
//       { user: foundUser.user },
//       process.env.REFRESH_TOKEN_SECRET,
//       { expiresIn: "30m" }
//     );

//     // Changed to let keyword
//     let newRefreshTokenArray = !cookies?.jwt
//       ? foundUser.refreshToken
//       : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

//     if (cookies?.jwt) {
//       /*
//             Scenario added here:
//                 1) User logs in but never uses RT and does not logout
//                 2) RT is stolen
//                 3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
//             */
//       const refreshToken = cookies.jwt;
//       const foundToken = await User.findOne({ refreshToken }).exec();

//       // Detected refresh token reuse!
//       if (!foundToken) {
//         // clear out ALL previous refresh tokens
//         newRefreshTokenArray = [];
//       }

//       res.clearCookie("jwt", {
//         httpOnly: true,
//         sameSite: "None",
//         secure: true,
//       });
//     }

//     // Saving refreshToken with current user
//     foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
//     const result = await foundUser.save();

//     // Creates Secure Cookie with refresh token
//     res.cookie("jwt", newRefreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       maxAge: 24 * 60 * 60 * 1000,
//     });

//     // Send authorization roles and access token to user
//     res.json({ accessToken });
//   } else {
//     res.sendStatus(401);
//   }
// };

module.exports = { handleLogin };
