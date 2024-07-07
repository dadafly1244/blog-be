const mongoose = require("mongoose");

const CommentSchema = mongoose.Schema(
  {
    comments: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Note",
    },
    replyingTo: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    isPrivate: {
      type: Boolean,
      required: false,
    },
    isDeleteByAdmin: {
      type: Boolean,
      default: false,
    },
    isDeleteByUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("comment", CommentSchema);
