/**
 * @file models/book.js
 */

const { Schema, model } = require("mongoose");

const bookSchema = new Schema({
  title: { type: String, required: true },
  comments: [{ type: String }],
});

module.exports = model("book", bookSchema);
