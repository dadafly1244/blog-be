const User = require("../model/User");
const jwt = require("jsonwebtoken");
const winston = require("winston");
const { v4: uuidv4 } = require("uuid");

// Winston 로거 설정
const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const handleRefreshToken = async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  logger.info(`Refresh token request received`, { requestId, ip: req.ip });

  const cookies = req.cookies;
  if (!cookies?.jwt) {
    logger.warn("No refresh token in cookies", { requestId });
    return res.sendStatus(401);
  }

  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  logger.debug("Cleared existing refresh token cookie", { requestId });
  try {
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
      logger.warn("Refresh token not found in database", {
        requestId,
        refreshToken: refreshToken.substring(0, 10) + "...",
      });

      // Detected refresh token reuse!
      if (!foundUser) {
        jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET,
          async (err, decoded) => {
            if (err) return res.sendStatus(403); //Forbidden
            // Delete refresh tokens of hacked user
            const hackedUser = await User.findOne({
              username: decoded.username,
            }).exec();
            hackedUser.refreshToken = [];
            const result = await hackedUser.save();
          }
        );
        return res.sendStatus(403); //Forbidden
      }
    }

    logger.debug("User found with refresh token", {
      requestId,
      username: foundUser.username,
    });

    const newRefreshTokenArray = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          logger.error("JWT verification failed", {
            requestId,
            error: err.message,
          });
          foundUser.refreshToken = [...newRefreshTokenArray];
          await foundUser.save();
          return res.sendStatus(403);
        }

        if (foundUser.username !== decoded.username) {
          logger.warn("Username mismatch in token", {
            requestId,
            tokenUsername: decoded.username,
            foundUsername: foundUser.username,
          });
          return res.sendStatus(403);
        }
        // Refresh token was still valid
        const roles = Object.values(foundUser.roles);
        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: decoded.username,
              roles: roles,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "10m" }
        );

        const newRefreshToken = jwt.sign(
          { username: foundUser.username },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "30m" }
        );
        // Saving refreshToken with current user
        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        await foundUser.save();

        // Creates Secure Cookie with refresh token
        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
          maxAge: 30 * 60 * 1000,
        });
        logger.info("Refresh token rotation successful", {
          requestId,
          username: foundUser.username,
          tokenExpiry: {
            accessToken: "10s",
            refreshToken: "15s",
          },
        });
        res.json({ accessToken });
      }
    );
  } catch (error) {
    logger.error("Unexpected error in refresh token handling", {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    res.sendStatus(500);
  } finally {
    logger.debug(`Refresh token request completed`, {
      requestId,
      processingTimeMs: Date.now() - startTime,
    });
  }
};

module.exports = { handleRefreshToken };
