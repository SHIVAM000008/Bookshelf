const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    author: { type: String, required: [true, 'Author is required'], trim: true },
    genre: { type: String, trim: true, default: 'General' },
    year: { type: Number, min: 0, max: new Date().getFullYear() },
    status: {
      type: String,
      enum: ['to-read', 'reading', 'finished'],
      default: 'to-read'
    },
    summary: { type: String, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
