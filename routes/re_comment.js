const express = require("express");
const asyncSQL = require("../functions/db");

const router = express.Router();

// 대댓글 조회
// 페이징 처리
router.get("/get/:cid", (req, res) => {
  const { cid } = req.params;
  let { page, count } = req.query;
  if (!cid) {
    res.status(400).end();
  }
  if (!count) {
    count = 10;
  }
  if (!page || page < 1) {
    page = 0;
  }

  asyncSQL(
    `
    SELECT
      r.re_id as reid, 
      u.u_id as uid, 
      u.u_img as uimg,
      u.u_email as email, 
      r.re_comment as content, 
      r.re_date as date
    FROM Re_comment r JOIN user u
    ON r.re_uid = u.u_id
    WHERE r.re_cid = "${cid}"
    ORDER BY r.re_date DESC
    LIMIT ${page * count}, ${count}
  `
  )
    .then((rows) => {
      res.status(200).json({
        status: "success",
        content: rows,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생 하였습니다.",
      });
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    });
});

// 대댓글 작성
router.post("/write", async (req, res) => {
  const { userId, content, bid, cid } = req.body;
  if (!userId || !content || !bid || !cid) {
    res.status(400).end();
  }

  try {
    const [rows] = await pool.query(
      `INSERT INTO Re_comment (re_comment, re_uid, re_bid, re_cid) VALUES ("${content}", "${userId}", "${bid}", "${cid}")`,
      [content, userId, bid, cid]
    );
    if (rows.affectedRows < 1) {
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생 했습니다.",
      });
    } else {
      res.status(201).json({
        status: "success",
        message: "성공되었습니다.",
        reid: `${rows.insertId}`,
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생 했습니다.",
    });
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }
  }
});

// 댓글 수정
// -> 어느 댓글인지 알기 위해서 commId
// 사용자를 확인 (본인 일치)
// -> 본인 일치 확인하기 위해서 userId
router.put("/fix/:re_cid", (req, res) => {
  const { re_cid } = req.params;
  const { userId, content } = req.body;

  // 본인 확인
  asyncSQL(
    `SELECT
      re_uid
    FROM Re_comment
    WHERE re_cid = ${re_cid}
  `
  )
    .then((rows) => {
      if (rows.length > 0) {
        if (rows[0].re_uid === Number(userId)) {
          asyncSQL(
            `UPDATE Re_comment SET re_comment = ? WHERE re_cid = ?`,
            [content, re_cid]
          )
            .then(() => {
              res.status(200).json({
                status: "success",
                message: "성공적으로 바뀌었습니다.",
              });
            })
            .catch((err) => {
              res.status(500).json({
                status: "fail",
                message: "서버에서 에러가 발생 하였습니다.",
              });
              if (process.env.NODE_ENV === "development") {
                console.error(err);
              }
            });
        } else {
          res.status(403).end();
        }
      } else {
        res.status(403).end();
      }
    })
    .catch((err) => {
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생 하였습니다.",
      });
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    });
  // 댓글 수정
});

// 댓글 삭제
// 어떤 댓글인지 알아야됨 -> cId
// 쓴 사람이 지운건지? -> uId
router.delete("/delete/:re_cid", async (req, res) => {
  const { re_cid } = req.params;
  const { uid } = req.query;

  if (!re_cid || !uid) {
    res.status(400).end();
    return;
  }

  try {
    const rows = await asyncSQL(`SELECT re_uid FROM Re_comment WHERE re_id = ?`, 
    [re_cid]);
    if (rows && rows.length > 0) {
      if (rows[0].re_uid === Number(uid)) {
        await asyncSQL(`DELETE FROM Re_comment WHERE re_id = ?`, [re_cid]);
        res.status(200).json({
          status: "success",
          message: "삭제되었습니다.",
        });
      } else {
        res.status(403).end();
      }
    } else {
      res.status(404).end();
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

module.exports = router;

