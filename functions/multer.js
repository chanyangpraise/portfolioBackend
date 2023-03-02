const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const MulterS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = MulterS3({
  s3,
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const newName = `${uuidv4()}${ext}`;
    cb(null, newName);
  },
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Wrong file type");
    error.code = "LIMIT_FILE_TYPES";
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
