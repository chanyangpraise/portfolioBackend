const express = require("express");
const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const boardRouter = require("./routes/board");
const commentRouter = require("./routes/comment");
const profileRouter = require("./routes/profile");
const app = express();

console.log(process.env.BUCKET_NAME);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// json 형식의 요청 body를 파싱
app.use(bodyParser.json({ limit: "100mb" }));
// urlencoded 형식의 요청 body를 파싱
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/board", boardRouter);
app.use("/comment", commentRouter);
app.use("/profile", profileRouter);

app.listen(3000, "0.0.0.0", () => {
  console.log("Server is running : port 3000");
});

module.exports = app;
