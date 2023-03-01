const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const MulterS3 = require("multer-s3");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

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
  shouldTransform: function (req, file, cb) {
    cb(null, /^image/i.test(file.mimetype));
  },
  transforms: [
    {
      id: "b_img",
      key: function (req, file, cb) {
        console.log(file);
        const ext = file.originalname.split('.').pop();
        cb(null, `${uuidv4()}-${file.originalname}.${ext}`);
      },
      transform: function (req, file, cb) {
        cb(null, sharp().jpeg());
      },
    },
    {
      id: "b_timg",
      key: function (req, file, cb) {
        const ext = file.originalname.split('.').pop();
        cb(null, Date.now().toString() + "-thumbnail-" + file.originalname + `.${ext}`);
      },
      transform: function (req, file, cb) {
        cb(null, sharp().resize(200, 200).jpeg());
      },
    },
    {
      id: "u_img",
      key: function (req, file, cb) {
        const uid = req.body.userId;
        const ext = file.originalname.split('.').pop();
        cb(null, `profile-${uid}-${uuidv4()}-${file.originalname}.${ext}`);
      },
      transform: function (req, file, cb) {
        cb(null, sharp().jpeg());
      },
    },
  ],
});


const upload = multer({ storage });

module.exports = upload;