const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { generateSummary, AIError } = require('../services/ai');

const router = express.Router();

function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid book id' });
  }
  next();
}

function handleError(err, res, next) {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message });
  }
  next(err);
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canAccess(user, book) {
  return user.role === 'admin' || Boolean(book.owner && book.owner.equals(user._id));
}

async function loadBook(req, res) {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404).json({ message: 'Book not found' });
    return null;
  }
  if (!canAccess(req.user, book)) {
    res.status(403).json({ message: 'You do not have access to this book' });
    return null;
  }
  return book;
}

router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };

    if (typeof req.query.status === 'string' && req.query.status) {
      filter.status = req.query.status;
    }
    if (typeof req.query.search === 'string' && req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ title: regex }, { author: regex }];
    }

    const books = await Book.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', checkId, async (req, res, next) => {
  try {
    const book = await loadBook(req, res);
    if (!book) return;
    res.json(book);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, author, genre, year, status } = req.body;
    const book = await Book.create({
      title,
      author,
      genre,
      year,
      status,
      owner: req.user._id
    });
    res.status(201).json(book);
  } catch (err) {
    handleError(err, res, next);
  }
});

router.put('/:id', checkId, async (req, res, next) => {
  try {
    const book = await loadBook(req, res);
    if (!book) return;

    const { title, author, genre, year, status } = req.body;
    book.set({ title, author, genre, year, status });
    await book.save();
    res.json(book);
  } catch (err) {
    handleError(err, res, next);
  }
});

router.post('/:id/summary', checkId, async (req, res, next) => {
  try {
    const book = await loadBook(req, res);
    if (!book) return;

    book.summary = await generateSummary(book);
    await book.save();
    res.json(book);
  } catch (err) {
    if (err instanceof AIError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
});

router.delete('/:id', checkId, async (req, res, next) => {
  try {
    const book = await loadBook(req, res);
    if (!book) return;

    await book.deleteOne();
    res.json({ message: 'Book deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
