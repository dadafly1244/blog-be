const User = require("../model/User");
const jwt = require("jsonwebtoken");
const winston = require("winston");
const { v4: uuidv4 } = require("uuid");

// // Winston 로거 설정
// const logger = winston.createLogger({
//   level: "debug",
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: "error.log", level: "error" }),
//     new winston.transports.File({ filename: "combined.log" }),
//   ],
// });

// const handleRefreshToken = async (req, res) => {
//   const requestId = uuidv4();
//   const startTime = Date.now();

//   logger.info(`Refresh token request received`, { requestId, ip: req.ip });

//   const cookies = req.cookies;
//   if (!cookies?.jwt) {
//     logger.warn("No refresh token in cookies", { requestId });
//     return res.sendStatus(401);
//   }

//   const refreshToken = cookies.jwt;
//   res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
//   logger.debug("Cleared existing refresh token cookie", { requestId });
//   try {
//     const foundUser = await User.findOne({ refreshToken }).exec();
//     if (!foundUser) {
//       logger.warn("Refresh token not found in database", {
//         requestId,
//         refreshToken: refreshToken.substring(0, 10) + "...",
//       });

//       // Detected refresh token reuse!
//       if (!foundUser) {
//         jwt.verify(
//           refreshToken,
//           process.env.REFRESH_TOKEN_SECRET,
//           async (err, decoded) => {
//             if (err) return res.sendStatus(403); //Forbidden
//             // Delete refresh tokens of hacked user
//             const hackedUser = await User.findOne({
//               user: decoded.user,
//             }).exec();
//             hackedUser.refreshToken = [];
//             const result = await hackedUser.save();
//           }
//         );
//         return res.sendStatus(403); //Forbidden
//       }
//     }

//     logger.debug("User found with refresh token", {
//       requestId,
//       user: foundUser.user,
//     });

//     const newRefreshTokenArray = foundUser.refreshToken.filter(
//       (rt) => rt !== refreshToken
//     );

//     jwt.verify(
//       refreshToken,
//       process.env.REFRESH_TOKEN_SECRET,
//       async (err, decoded) => {
//         if (err) {
//           logger.error("JWT verification failed", {
//             requestId,
//             error: err.message,
//           });
//           foundUser.refreshToken = [...newRefreshTokenArray];
//           await foundUser.save();
//           return res.sendStatus(403);
//         }

//         if (foundUser.user !== decoded.user) {
//           logger.warn("user mismatch in token", {
//             requestId,
//             tokenuser: decoded.user,
//             founduser: foundUser.user,
//           });
//           return res.sendStatus(403);
//         }
//         // Refresh token was still valid
//         const roles = Object.values(foundUser.roles);
//         const accessToken = jwt.sign(
//           {
//             UserInfo: {
//               user: decoded.user,
//               roles: roles,
//             },
//           },
//           process.env.ACCESS_TOKEN_SECRET,
//           { expiresIn: "10m" }
//         );

//         const newRefreshToken = jwt.sign(
//           { user: foundUser.user },
//           process.env.REFRESH_TOKEN_SECRET,
//           { expiresIn: "30m" }
//         );
//         // Saving refreshToken with current user
//         foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
//         await foundUser.save();

//         // Creates Secure Cookie with refresh token
//         res.cookie("jwt", newRefreshToken, {
//           httpOnly: true,
//           secure: true,
//           sameSite: "None",
//           maxAge: 30 * 60 * 1000,
//         });
//         logger.info("Refresh token rotation successful", {
//           requestId,
//           user: foundUser.user,
//           tokenExpiry: {
//             accessToken: "10s",
//             refreshToken: "15s",
//           },
//         });
//         res.json({ accessToken });
//       }
//     );
//   } catch (error) {
//     logger.error("Unexpected error in refresh token handling", {
//       requestId,
//       error: error.message,
//       stack: error.stack,
//     });
//     res.sendStatus(500);
//   } finally {
//     logger.debug(`Refresh token request completed`, {
//       requestId,
//       processingTimeMs: Date.now() - startTime,
//     });
//   }
// };

const handleRefreshToken = async (req, res) => {
  const requestId =
    Date.now().toString(36) + Math.random().toString(36).substr(2);
  const startTime = Date.now();

  console.log(
    `[INFO] [${requestId}] Refresh token request received. IP: ${req.ip}`
  );

  const cookies = req.cookies;
  if (!cookies?.jwt) {
    console.log(`[WARN] [${requestId}] No refresh token in cookies`);
    return res.sendStatus(401);
  }

  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  console.log(`[DEBUG] [${requestId}] Cleared existing refresh token cookie`);

  try {
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
      console.log(
        `[WARN] [${requestId}] Refresh token not found in database. Token: ${refreshToken.substring(
          0,
          10
        )}...`
      );

      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
          if (err) return res.sendStatus(403); //Forbidden
          // Delete refresh tokens of hacked user
          const hackedUser = await User.findOne({
            user: decoded.user,
          }).exec();
          hackedUser.refreshToken = [];
          const result = await hackedUser.save();
        }
      );

      return res.sendStatus(403);
    }

    console.log(
      `[DEBUG] [${requestId}] User found with refresh token. user: ${foundUser.user}`
    );

    const newRefreshTokenArray = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          console.error(
            `[ERROR] [${requestId}] JWT verification failed. Error: ${err.message}`
          );
          foundUser.refreshToken = [...newRefreshTokenArray];
          await foundUser.save();
          return res.sendStatus(403);
        }

        if (foundUser.user !== decoded.user) {
          console.warn(
            `[WARN] [${requestId}] user mismatch in token. Token user: ${decoded.user}, Found user: ${foundUser.user}`
          );
          return res.sendStatus(403);
        }

        const accessToken = jwt.sign(
          {
            UserInfo: {
              user: decoded.user,
              roles: roles,
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

        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        await foundUser.save();

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
          maxAge: 30 * 60 * 1000,
        });

        console.log(
          `[INFO] [${requestId}] Refresh token rotation successful. user: ${foundUser.user}, Token expiry: { accessToken: '10s', refreshToken: '15s' }`
        );

        res.json({ accessToken });
      }
    );
  } catch (error) {
    console.error(
      `[ERROR] [${requestId}] Unexpected error in refresh token handling. Error: ${error.message}\nStack: ${error.stack}`
    );
    res.sendStatus(500);
  } finally {
    console.log(
      `[DEBUG] [${requestId}] Refresh token request completed. Processing time: ${
        Date.now() - startTime
      }ms`
    );
  }
};

module.exports = { handleRefreshToken };
