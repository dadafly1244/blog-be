const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  roles: {
    User: {
      type: String,
      default: "User",
      enum: ["Admin", "Editor", "User"],
    },
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    firstName: String,
    lastName: String,
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer not to say"],
    },
    birthDate: Date,
    bio: String,
    status: {
      type: String,
      default: "active",
    },
    avatar: String, // URL to avatar image
    location: String,
    website: String,
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
    },
  },
  refreshToken: [String],
});

module.exports = mongoose.model("User", userSchema);
