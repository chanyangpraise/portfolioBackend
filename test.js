//댓글 삭제
router.delete("/delete/:cid", (req, res) => {
  const { cid } = req.params;
  const { uid } = req.query;
  if (!cid || !uid) {
    res.status(400).end();
  }

  asyncSQL(`SELECT c_uid FROM comment WHERE c_id = ${cid}; `)
    .then((rows) => {
      if (rows.length > 0) {
        if (rows[0].c_uid === Number(uid)) {
          asyncSQL(`DELETE FROM comment WHERE c_id = "${cid}"; `)
            .then(() => {
              res.status(200).json({
                status: "success",
                message: "성공적으로 바뀌었습니다.",
              });
            })
            .catch((err) => {
              res.status(500).json({
                status: "fail",
                message: "서버에서 에러가 발생 했습니다.",
              });
              if (process.env.NODE_ENV === "development") {
                console.error(err);
              }
            });
        } else {
          res.status(403).end();
        }
      } else {
        res.status(404).end();
      }
    })
    .catch((err) => {
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생 했습니다.",
      });
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    });
});
//대댓
router.post("/write/:bid", async (req, res) => {
  const { bid } = req.params;
  const { uid, content, parentId } = req.body;

  if (!uid || !content || !bid) {
    res.status(400).end();
  }

  asyncSQL(
    `
    INSERT INTO comment (c_bid, c_uid, c_content, c_parent_id, c_date) 
    VALUES ("${bid}", "${uid}", "${content}", ${
      parentId || null
    }, "${new Date().toISOString()}")`
  )
    .then((rows) => {
      if (rows.affectedRows < 1) {
        res.status(500).json({
          status: "fail",
          message: "서버에서 에러가 발생 했습니다.",
        });
      } else {
        res.status(201).json({
          status: "success",
          message: "성공되었습니다.",
          cid: `${rows.insertId}`,
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생 했습니다.",
      });
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    });
});
//대댓수정
router.put("/fix/:re_cid", async (req, res) => {
  const { re_cid } = req.params;
  const { userId, content } = req.body;

  try {
    // 본인 확인
    const [userRows] = await asyncSQL(
      `
      SELECT
        re_uid
      FROM Re_comment
      WHERE re_cid = ?
      `,
      [re_cid]
    );

    if (userRows.length > 0 && userRows[0].re_uid === Number(userId)) {
      // 댓글 수정
      const [updateRows] = await asyncSQL(
        `
        UPDATE Re_comment SET re_comment = ?
        WHERE re_cid = ?
        `,
        [content, re_cid]
      );

      if (updateRows.affectedRows > 0) {
        res.status(200).json({
          status: "success",
          message: "성공적으로 수정되었습니다.",
        });
      } else {
        res.status(500).json({
          status: "fail",
          message: "서버에서 에러가 발생했습니다.",
        });
      }
    } else {
      res.status(403).end();
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생했습니다.",
    });
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }
  }
});
//프로필이미지 multer.js
const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
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
    {
      id: "u_img",
      key: function (req, file, cb) {
        const uid = req.user.id;
        cb(null, `profile-${uid}-${uuidv4()}-${file.originalname}`);
      },
      transform: function (req, file, cb) {
        cb(null, sharp().jpeg());
      },
    },
  ],
});

const upload = multer({ storage });

module.exports = upload;


//게시물 삭제
router.delete("/delete/:bid", async (req, res) => {
  const bid = req.params.bid;
  const uid = req.body.uid;
  await asyncSQL(`SELECT * FROM Board WHERE b_id=${bid} AND b_uid=${uid}`)
    .then(async (rows) => {
      if (rows.length < 1) {
        res.status(404).json({
          status: "fail",
          message: "해당 게시글을 찾을 수 없습니다.",
        });
      } else {
        // 게시물 이미지와 썸네일 이미지 삭제
        await deleteBoardImages(rows[0]);
        // 게시물 삭제
        // 게시물 삭제
        await asyncSQL(`DELETE FROM Board WHERE b_id=${bid} AND b_uid=${uid}`)
          .then((result) => {
            res.status(200).json({
              status: "success",
              message: "게시글이 삭제되었습니다.",
            });
          })
          .catch((err) => {
            res.status(500).json({
              status: "fail",
              message: "서버에서 에러가 발생 했습니다.",
            });
            if (process.env.NODE_ENV === "development") {
              console.error(err);
            }
          });
      }
    })
    .catch((err) => {
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생 했습니다.",
      });
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    });
});

//게시물 삭제2
const router = require("express").Router();
const asyncSQL = require("../db");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function deleteBoardImages(board) {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Delete: {
      Objects: [{ Key: board.b_img }, { Key: board.b_timg }],
    },
  };
  await s3Client.send(new DeleteObjectCommand(params));
}

router.delete("/delete/:bid", async (req, res) => {
  const bid = req.params.bid;
  const uid = req.body.uid;
  await asyncSQL(`SELECT * FROM Board WHERE b_id=${bid} AND b_uid=${uid}`)
    .then(async (rows) => {
      if (rows.length < 1) {
        res.status(404).json({
          status: "fail",
          message: "해당 게시글을 찾을 수 없습니다.",
        });
      } else {
        await deleteBoardImages(rows[0]);
        await asyncSQL(`DELETE FROM Board WHERE b_id=${bid} AND b_uid=${uid}`)
          .then((result) => {
            res.status(200).json({
              status: "success",
              message: "게시글이 삭제되었습니다.",
            });
          })
          .catch((err) => {
            res.status(500).json({
              status: "fail",
              message: "서버에서 에러가 발생 했습니다.",
            });
            if (process.env.NODE_ENV === "development") {
              console.error(err);
            }
          });
      }
    })
    .catch((err) => {
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생 했습니다.",
      });
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    });
});

//프로필 조회 프로미스문 테스트
router.get("/get/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const { getId } = req.query;
    if (!uid || !getId) {
      return res.status(400).end();
    }

    const rows = await asyncSQL(`
      SELECT
        u_email,
        u_img
      FROM user
      WHERE u_id = ${uid};
    `);
    if (rows.length === 0) {
      return res.status(200).json({
        status: "fail",
        message: "사용자가 존재하지 않습니다.",
      });
    }

    const rows1 = await asyncSQL(`
      SELECT
        COUNT(f_follower) as follower
      FROM follow
      WHERE f_following = ${uid};
    `);
    const rows2 = await asyncSQL(`
      SELECT
        COUNT(f_following) as following
      FROM follow
      WHERE f_follower = ${uid};
    `);
    const rows3 = await asyncSQL(`
      SELECT
        f_id
      FROM follow
      WHERE f_follower = ${uid} AND f_following = ${getId};
    `);

    const info = {
      email: rows[0].u_email,
      uimg: rows[0].u_img,
      follower: rows1[0].follower,
      following: rows2[0].following,
      isFollow: rows3.length > 0,
    };
    return res.status(200).json({
      status: "success",
      info,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생 하였습니다.",
    });
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }
  }
});

module.exports = router;
