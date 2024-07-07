const Comment = require("../model/Comment");

// Helper function for pagination
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

// @desc Get all comments
// @route GET /comments
// @access Private
const getAllComments = async (req, res) => {
  try {
    const { page, size, noteId } = req.query;
    const { limit, offset } = getPagination(page, size);

    const condition = noteId ? { noteId: noteId } : {};

    const comments = await Comment.find(condition)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("user", "username")
      .lean();

    const count = await Comment.countDocuments(condition);

    res.json({
      totalItems: count,
      comments,
      currentPage: page ? +page : 0,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create new Comment
// @route POST /comments
// @access Private
const createNewComment = async (req, res) => {
  try {
    const { noteId, comments, replyingTo, isPrivate } = req.body;
    const user = req.user.id; // Assuming user ID is set by auth middleware

    if (!noteId || !comments) {
      return res
        .status(400)
        .json({ message: "NoteId and comments are required" });
    }

    const newComment = await Comment.create({
      user,
      noteId,
      comments,
      replyingTo,
      isPrivate,
    });

    if (replyingTo) {
      await Comment.findByIdAndUpdate(replyingTo, {
        $push: { replies: newComment._id },
      });
    }

    res
      .status(201)
      .json({ message: "New comment created", comment: newComment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Update a Comment
// @route PATCH /comments/:id
// @access Private
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, isPrivate } = req.body;

    if (!comments) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user is the owner of the comment
    if (comment.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "User not authorized to update this comment" });
    }

    comment.comments = comments;
    if (typeof isPrivate !== "undefined") {
      comment.isPrivate = isPrivate;
    }

    const updatedComment = await comment.save();

    res.json({ message: "Comment updated", comment: updatedComment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Delete a Comment
// @route DELETE /comments/:id
// @access Private
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.roles.includes("Admin"); // Assuming roles are set by auth middleware

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user is the owner of the comment or an admin
    if (comment.user.toString() !== req.user.id && !isAdmin) {
      return res
        .status(403)
        .json({ message: "User not authorized to delete this comment" });
    }

    if (isAdmin) {
      comment.isDeleteByAdmin = true;
      comment.isDelete = true;
    } else {
      comment.isDelete = true;
    }

    await comment.save();

    res.json({
      message: isAdmin ? "Comment deleted by admin" : "Comment deleted",
      isDeleteByAdmin: comment.isDeleteByAdmin,
      isDelete: comment.isDelete,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get replies for a comment
// @route GET /comments/:id/replies
// @access Private
const getReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);

    const comment = await Comment.findById(id)
      .populate({
        path: "replies",
        populate: { path: "user", select: "username" },
        match: { isDelete: false },
        options: { skip: offset, limit: limit, sort: { createdAt: -1 } },
      })
      .exec();

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const count = comment.replies.length;

    res.json({
      totalItems: count,
      replies: comment.replies,
      currentPage: page ? +page : 0,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get comments for a specific note
// @route GET /comments/note/:noteId
// @access Private
const getCommentsByNoteId = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);

    const comments = await Comment.find({ noteId, isDelete: false })
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("user", "username")
      .lean();

    const count = await Comment.countDocuments({ noteId, isDelete: false });

    res.json({
      totalItems: count,
      comments,
      currentPage: page ? +page : 0,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllComments,
  createNewComment,
  updateComment,
  deleteComment,
  getReplies,
  getCommentsByNoteId,
};
