const mongoose = require("mongoose");
const multer = require("multer");
const MulterGridfsStorage = require("multer-gridfs-storage");
const crypto = require("crypto");
const path = require("path");
const mongoURI = process.env.DATABASE_URI;

let gfs;
const conn = mongoose.connection;

conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "avatars",
  });
  console.log("GridFS connection successful");
});

conn.on("error", (err) => {
  console.error("GridFS connection error:", err);
});

const storage = new MulterGridfsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "avatars",
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({ storage });

module.exports = { upload, gfs };
