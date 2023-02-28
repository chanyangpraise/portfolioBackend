const express = require("express");
const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const cors = require("cors");
require("dotenv").config();

const boardRouter = require("./routes/board");

const app = express();

console.log(process.env.BUCKET_NAME);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname + "/../Frontend/build")));

app.use("/board", boardRouter);

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server is running : port 3000");
});

module.exports = app;
