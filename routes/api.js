/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const sanitizeHtml = require("sanitize-html");
const book = require("../models/book");

module.exports = function (app) {
  app
    .route("/api/books")
    .get(async function (req, res) {
      try {
        const fetchedBooks = await book.find({});

        return res.json(
          fetchedBooks.map((fetchedBook) => ({
            title: fetchedBook.title,
            _id: fetchedBook._id,
            commentcount: fetchedBook.comments.length,
          }))
        );
      } catch {
        return res.send("cannot get books");
      }
    })

    .post(async function (req, res) {
      const { title } = req.body;
      if (!title) {
        return res.send("missing required field title");
      }

      const sanitizedTitle = sanitizeHtml(title, { allowedTags: [] }).trim();
      if (!sanitizedTitle) {
        return res.send("sanitized title is empty");
      }

      try {
        const postedBook = await book.create({ title: sanitizedTitle });

        return res
          .status(200)
          .json({ title: postedBook.title, _id: postedBook._id });
      } catch {
        return res.send("cannot post book");
      }
    })

    .delete(async function (req, res) {
      try {
        await book.deleteMany({});

        return res.send("complete delete successful");
      } catch {
        res.send("cannot delete books");
      }
    });

  app
    .route("/api/books/:id")
    .get(async function (req, res) {
      const { id } = req.params;

      try {
        const fetchedBook = await book.findById(id);
        if (!fetchedBook) {
          return res.send("no book exists");
        }

        return res.json({
          _id: fetchedBook._id,
          title: fetchedBook.title,
          comments: fetchedBook.comments,
        });
      } catch {
        return res.send("cannot get book");
      }
    })

    .post(async function (req, res) {
      const { id } = req.params;
      const { comment } = req.body;

      if (!comment) {
        return res.send("missing required field comment");
      }

      const sanitizedComment = sanitizeHtml(comment, {
        allowedTags: [],
      }).trim();
      if (!sanitizedComment) {
        return res.send("sanitized comment is empty");
      }

      try {
        const fetchedBook = await book.findById(id);
        if (!fetchedBook) {
          return res.send("no book exists");
        }

        fetchedBook.comments.push(sanitizedComment);
        const savedBook = await fetchedBook.save();

        return res.json({
          _id: savedBook._id,
          title: savedBook.title,
          comments: savedBook.comments,
        });
      } catch {
        return res.send("cannot post comment");
      }
    })

    .delete(async function (req, res) {
      const { id } = req.params;

      try {
        const fetchedBook = await book.findById(id);
        if (!fetchedBook) {
          return res.send("no book exists");
        }

        await fetchedBook.remove();

        return res.send("delete successful");
      } catch {
        return res.send("cannot delete book");
      }
    });
};
