const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3-transform");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const storage = multerS3({
  s3: new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
  bucket: process.env.BUCKET_NAME,
  acl: "public-read",
  shouldTransform: function (req, file, cb) {
    cb(null, /^image/i.test(file.mimetype));
  },
  transforms: [
    {
      id: "b_img",
      key: function (req, file, cb) {
        cb(null, `${uuidv4()}-${file.originalname}`);
      },
      transform: function (req, file, cb) {
        cb(null, sharp().jpeg());
      },
    },
    {
      id: "b_timg",
      key: function (req, file, cb) {
        cb(null, Date.now().toString() + "-thumbnail-" + file.originalname);
      },
      transform: function (req, file, cb) {
        cb(null, sharp().resize(200, 200).jpeg());
      },
    },
  ],
});

const upload = multer({ storage });

module.exports = upload;
