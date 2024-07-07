const Note = require("../model/Note");

const getAllNotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || "-createdAt";

    const notes = await Note.find()
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "username")
      .populate("categories", "name")
      .lean();

    const total = await Note.countDocuments();

    if (!notes.length) {
      return res.status(404).json({ message: "No notes found" });
    }

    res.json({
      notes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotes: total,
    });
  } catch (error) {
    next(error);
  }
};

const getNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("user", "username")
      .populate("categories", "name")
      .lean();
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json(note);
  } catch (error) {
    next(error);
  }
};

const createNewNote = async (req, res, next) => {
  try {
    const { title, description, picture, categories } = req.body;
    const user = req.user.id;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    const note = await Note.create({
      user,
      title,
      description,
      picture,
      categories,
    });

    res.status(201).json({ message: "New note created", note });
  } catch (error) {
    next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { title, description, picture, completed, categories } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check if the user is the owner of the note
    if (note.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only update your own notes" });
    }

    if (title) note.title = title;
    if (description) note.description = description;
    if (picture !== undefined) note.picture = picture;
    if (completed !== undefined) note.completed = completed;
    if (categories !== undefined) note.categories = categories;

    const updatedNote = await note.save();
    res.json({ message: "Note updated", note: updatedNote });
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check if the user is the owner of the note
    if (note.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own notes" });
    }

    await note.remove();
    res.json({ message: "Note deleted" });
  } catch (error) {
    next(error);
  }
};

const getNotesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const notes = await Note.find({ categories: category })
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "username")
      .populate("categories", "name")
      .lean();

    const total = await Note.countDocuments({ categories: category });

    if (!notes.length) {
      return res
        .status(404)
        .json({ message: "No notes found in this category" });
    }

    res.json({
      notes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotes: total,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNotes,
  getNote,
  createNewNote,
  updateNote,
  deleteNote,
  getNotesByCategory,
};
