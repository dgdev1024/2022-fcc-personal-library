/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *
 */

const Browser = require("zombie");
const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const book = require("../models/book");
const { ObjectId } = require("mongoose").Types;

chai.use(chaiHttp);

Browser.site = process.env.SITE_URL || "http://localhost:3000";

const BOOK_FIXED_ID = "56cb91bdc3464f14678934ca";
const BOOK_NOT_FOUND_ID = "56cb91bdc3464f14678934cb";

suite("Functional Tests", function () {
  /*
   * ----[EXAMPLE TEST]----
   * Each test should completely test the response of the API end-point including response status code!
   */
  // test("#example Test GET /api/books", function (done) {
  //   chai
  //     .request(server)
  //     .get("/api/books")
  //     .end(function (err, res) {
  //       assert.equal(res.status, 200);
  //       assert.isArray(res.body, "response should be an array");
  //       assert.property(
  //         res.body[0],
  //         "commentcount",
  //         "Books in array should contain commentcount"
  //       );
  //       assert.property(
  //         res.body[0],
  //         "title",
  //         "Books in array should contain title"
  //       );
  //       assert.property(
  //         res.body[0],
  //         "_id",
  //         "Books in array should contain _id"
  //       );
  //       done();
  //     });
  // });
  /*
   * ----[END of EXAMPLE TEST]----
   */

  this.beforeAll(async () => {
    await book.deleteMany({
      title: /^TEST/,
    });

    await book.create({
      _id: new ObjectId(BOOK_FIXED_ID),
      title: "TEST Rock And Roll",
    });
  });

  this.afterAll(async () => {
    await book.deleteMany({
      title: /^TEST/,
    });
  });

  suite("Routing tests", () => {
    suite(
      "POST /api/books with title => create book object/expect book object",
      () => {
        test("Test POST /api/books with title", async () => {
          const res = await chai.request(server).post("/api/books").send({
            title: "TEST Moby Dick",
          });

          assert.strictEqual(res.status, 200);
          assert.strictEqual(res.body.title, "TEST Moby Dick");
        });

        test("Test POST /api/books with no title given", async () => {
          const res = await chai.request(server).post("/api/books").send({
            title: undefined,
          });

          assert.strictEqual(res.text, "missing required field title");
        });

        test("Test POST /api/books with title containing XSS", async () => {
          const res = await chai.request(server).post("/api/books").send({
            title: "TEST Keep On <b>Rocking</b>",
          });

          assert.strictEqual(res.status, 200);
          assert.strictEqual(res.body.title, "TEST Keep On Rocking");
        });

        test("Test POST /api/books with title that would be empty after sanitizing", async () => {
          const res = await chai.request(server).post("/api/books").send({
            title: `<img onerror="alert("XSS!");" />`,
          });

          assert.strictEqual(res.text, "sanitized title is empty");
        });
      }
    );

    suite("GET /api/books => array of books", () => {
      test("Test GET /api/books", async () => {
        const res = await chai.request(server).get("/api/books");

        assert.strictEqual(res.status, 200);
        assert.isArray(res.body);

        const firstBook = res.body[0];

        assert.property(
          firstBook,
          "title",
          "Book object should contain a title."
        );

        assert.property(
          firstBook,
          "commentcount",
          "Book object should have a comment count."
        );

        assert.property(
          firstBook,
          "_id",
          "Book object should contain a MongoDB ObjectID."
        );
      });
    });

    suite("GET /api/books/[id] => book object with [id]", () => {
      test("Test GET /api/books/[id] with id not in db", async () => {
        const res = await chai
          .request(server)
          .get(`/api/books/${BOOK_NOT_FOUND_ID}`);

        assert.strictEqual(res.text, "no book exists");
      });

      test("Test GET /api/books/[id] with invalid id", async () => {
        const res = await chai.request(server).get(`/api/books/NOT_A_VALID_ID`);

        assert.strictEqual(res.text, "cannot get book");
      });

      test("Test GET /api/books/[id] with valid id in db", async () => {
        const res = await chai
          .request(server)
          .get(`/api/books/${BOOK_FIXED_ID}`);

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.type, "application/json");

        assert.isObject(res.body);
        assert.property(res.body, "_id");
        assert.strictEqual(res.body._id, BOOK_FIXED_ID);

        assert.property(res.body, "title");
        assert.strictEqual(res.body.title, "TEST Rock And Roll");

        assert.property(res.body, "comments");
        assert.isArray(res.body.comments);
      });
    });

    suite(
      "POST /api/books/[id] => add comment/expect book object with id",
      () => {
        test("Test POST /api/books/[id] with comment", async () => {
          const res = await chai
            .request(server)
            .post(`/api/books/${BOOK_FIXED_ID}`)
            .send({ comment: "This is a comment." });

          assert.strictEqual(res.status, 200);
          assert.strictEqual(res.type, "application/json");

          assert.isObject(res.body);
          assert.property(res.body, "_id");
          assert.strictEqual(res.body._id, BOOK_FIXED_ID);

          assert.property(res.body, "title");
          assert.strictEqual(res.body.title, "TEST Rock And Roll");

          assert.property(res.body, "comments");
          assert.isArray(res.body.comments);
          assert.strictEqual(res.body.comments.length, 1);
          assert.strictEqual(res.body.comments[0], "This is a comment.");
        });

        test("Test POST /api/books/[id] with comment containing XSS.", async () => {
          const res = await chai
            .request(server)
            .post(`/api/books/${BOOK_FIXED_ID}`)
            .send({ comment: "This is <b>not a bold comment</b>." });

          assert.strictEqual(res.status, 200);
          assert.strictEqual(res.type, "application/json");

          assert.isObject(res.body);
          assert.property(res.body, "_id");
          assert.strictEqual(res.body._id, BOOK_FIXED_ID);

          assert.property(res.body, "title");
          assert.strictEqual(res.body.title, "TEST Rock And Roll");

          assert.property(res.body, "comments");
          assert.isArray(res.body.comments);
          assert.strictEqual(res.body.comments.length, 2);
          assert.strictEqual(
            res.body.comments[1],
            "This is not a bold comment."
          );
        });

        test("Test POST /api/books/[id] without comment field", async () => {
          const res = await chai
            .request(server)
            .post(`/api/books/${BOOK_FIXED_ID}`)
            .send({ comment: undefined });

          assert.strictEqual(res.text, "missing required field comment");
        });

        test("Test POST /api/books/[id] with comment that would be empty after sanitizing", async () => {
          const res = await chai
            .request(server)
            .post(`/api/books/${BOOK_FIXED_ID}`)
            .send({ comment: `<img onerror="alert("XSS!");" />` });

          assert.strictEqual(res.text, "sanitized comment is empty");
        });

        test("Test POST /api/books/[id] with comment, id not in db", async () => {
          const res = await chai
            .request(server)
            .post(`/api/books/${BOOK_NOT_FOUND_ID}`)
            .send({ comment: "This is a comment." });

          assert.strictEqual(res.text, "no book exists");
        });

        test("Test POST /api/books/[id] with comment, invalid id", async () => {
          const res = await chai
            .request(server)
            .post(`/api/books/NOT_A_VALID_ID`)
            .send({ comment: "This is a comment." });

          assert.strictEqual(res.text, "cannot post comment");
        });
      }
    );

    suite("DELETE /api/books/[id] => delete book object id", () => {
      test("Test DELETE /api/books/[id] with valid id in db", async () => {
        const res = await chai
          .request(server)
          .delete(`/api/books/${BOOK_FIXED_ID}`);

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.text, "delete successful");

        const count = await book.countDocuments({ _id: BOOK_FIXED_ID });

        assert.strictEqual(count, 0);
      });

      test("Test DELETE /api/books/[id] with  id not in db", async () => {
        const res = await chai
          .request(server)
          .delete(`/api/books/${BOOK_FIXED_ID}`);

        assert.strictEqual(res.text, "no book exists");
      });

      test("Test DELETE /api/books/[id] with invalid id", async () => {
        const res = await chai
          .request(server)
          .delete(`/api/books/NOT_A_VALID_ID`);

        assert.strictEqual(res.text, "cannot delete book");
      });
    });
  });

  suite("Headless Browser Tests", () => {
    const browser = new Browser();

    suiteSetup(async () => {
      await browser.visit("/");
    });

    test("Headless browser should have a valid 'site' property", async () => {
      assert.isNotNull(browser.site);
    });

    test("Submit the book title 'TEST Zombie Test' in the #newBookForm form", async () => {
      await browser.fill("#bookTitleToAdd", "TEST Zombie Test");
      await browser.pressButton("Submit New Book!");
      browser.assert.success();

      const bookItems = [...browser.querySelectorAll(".bookItem")]
        .filter((item) => {
          return item.innerHTML.startsWith("TEST");
        })
        .map((item) => item.innerHTML);

      assert.strictEqual(bookItems.length, 3);
      assert.isTrue(bookItems.at(-1).startsWith("TEST Zombie Test"));
      assert.isTrue(bookItems.at(-1).endsWith("0 comments"));
    });

    test("Click the 'TEST Zombie Test' book title in the book item display to bring up the comments form", async () => {
      const bookItems = [...browser.querySelectorAll(".bookItem")].filter(
        (item) => {
          return item.innerHTML.startsWith("TEST");
        }
      );

      await browser.click(bookItems.at(-1));

      browser.assert.success();

      browser.assert.text("#detailTitle", /^TEST Zombie Test/);
      browser.assert.elements("#newCommentForm", 1);
    });

    test("Submit a comment on the book title 'TEST Zombie Test' in the #newCommentForm form", async () => {
      browser.assert.elements("#commentToAdd", 1);

      await browser.fill("#commentToAdd", "This is a comment.");
      await browser.pressButton("Add Comment");

      browser.assert.success();
      browser.assert.text("#detailComments", /^This is a comment\./);
    });

    test("Verify that the comment has been posted on the book title 'TEST Zombie Test'", async () => {
      const bookItems = [...browser.querySelectorAll(".bookItem")].filter(
        (item) => {
          return item.innerHTML.startsWith("TEST");
        }
      );

      await browser.click(bookItems.at(-1));

      browser.assert.success();
      browser.assert.elements("#detailComments li", 1);
      browser.assert.text("#detailComments li", "This is a comment.");
    });

    test("Delete the book titled 'TEST Zombie Test' in the #newCommentForm form", async () => {
      await browser.pressButton("Delete Book");
      browser.assert.success();

      browser.assert.elements("#detailComments p", 3);
      browser.assert.text("#detailComments", /^delete successful/);
      browser.assert.text("#detailComments", /Refresh the page$/);
    });

    test("Verify that the book titled 'TEST Zombie Test' has been deleted", async () => {
      await browser.reload();

      const bookItems = [...browser.querySelectorAll(".bookItem")].filter(
        (item) => {
          return item.innerHTML.startsWith("TEST Zombie Test");
        }
      );

      assert.strictEqual(bookItems.length, 0);
    });

    test("Delete all books, then verify that all books have been deleted", async () => {
      await browser.pressButton("Delete all books...");
      browser.assert.success();

      await browser.reload();

      const bookItems = [...browser.querySelectorAll(".bookItem")];

      assert.strictEqual(bookItems.length, 0);
    });
  });
});
