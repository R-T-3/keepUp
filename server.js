// Dependencies
const express = require("express");
const exphbs = require("express-handlebars");
const logger = require("morgan");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
const db = require("./models");
const PORT = 3000;

// Initialize express
const app = express();

// // MongoDB config
// const databaseURL = "keepUpDb";
// const collection = ["news"]

// Middleware setup

// Morgan logger for logging requests
app.use(logger("dev"));

// JSON parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Make public a static folder
app.use(express.static("public"));

// Handlebars set up
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

// Heroku deployed DB
// var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/keepUpDb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/keepUpDb";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true }, function(error){
  if (error) console.log(error);

    console.log("connection successfull");
});

// // Connect mongojs config to db variable
// const db = mongojs(databaseURL, collection);
// db.on("error", function(error) {
//     console.log("Database Error:", error);
// })


// Routes  ----------------------------------------
app.get("/", function(req, res) {
    db.Article.find({})
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res, json(err);
      });
  });
  
app.get("/scrape", function(req, res) {
  axios.get("https://www.fantasypros.com/").then(function(response) {
    console.log("initiating scrape");
    let $ = cheerio.load(response.data);
    
    // Looks for these tags
    $(".news-articles__item").each(function(i, element) {
        let result = {};
        
        // Gets the text, link, and image we are looking for
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
        result.img = $(this)
          .children("a")
          .children("image")
        
          // Create a new object in our database for each article
        db.Article.create(result)
          .then(function(dbArticle) {
            console.log(dbArticle);
          })
          .catch(function(err) {
            console.log(err);
          });
    });
    
    // Let user know the scrape is finished
    res.send("Scrape Complete");
  });
});
  
// Route for posting a note to a specific Article using the article id
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res, json(err);
    });
});
  
// Server start
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
  });