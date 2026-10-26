const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Book.deleteMany({ owner: user._id });
    res.json({ message: 'User and their books deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
