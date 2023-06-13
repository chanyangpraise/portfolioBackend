const express = require("express");
const asyncSQL = require("../functions/db");
const upload = require("../functions/multer");
const { deleteBoardImages } = require("../functions/delete");

const router = express.Router();

// 게시글 작성
router.post("/write", upload.single("image"), async (req, res) => {
  const { uid, content } = req.body;
  if (!uid || !req.file) {
    res.status(400).end();
    return;
  }
  const { location } = req.file;

  try {
    const query = `INSERT INTO Board (b_comment, b_uid, b_img) VALUES (?, ?, ?)`;
    const params = [content, parseInt(uid), location];
    const rows = await asyncSQL(query, params);

    if (!rows || rows.insertId < 1) {
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생했습니다.",
      });
    } else {
      res.status(201).json({
        status: "success",
        message: "성공되었습니다.",
        bid: `${rows.insertId}`,
        bimg: location,
      });
    }
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "서버에서 에러가 발생했습니다.",
    });
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }
  }
});

//게시글 수정
router.put("/update/:bid", async (req, res) => {
  const bid = req.params.bid;
  const { uid, content } = req.body;
  if (!uid) {
    res.status(400).end();
    return;
  }
  await asyncSQL(
    "UPDATE Board SET b_comment = ? WHERE b_id = ? AND b_uid = ?",
    [content, bid, uid]
  )
    .then(() => {
      res.status(200).json({
        status: "success",
        message: "게시글이 수정되었습니다.",
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
});

//게시글 삭제
router.delete("/delete/:bid", async (req, res) => {
  const bid = req.params.bid;
  const uid = req.query.uid;

  try {
    const rows = await asyncSQL(
      "SELECT * FROM Board WHERE b_id = ? AND b_uid = ?",
      [bid, uid]
    );
    if (rows.length < 1) {
      return res.status(404).json({
        status: "fail",
        message: "해당 게시글을 찾을 수 없습니다.",
      });
    }

    await asyncSQL("DELETE FROM b_Like WHERE bl_bid = ?", [bid]);
    await asyncSQL("DELETE FROM Comment WHERE c_bid = ?", [bid]);

    const board = { b_img: rows[0].b_img.split("/").pop() };
    await Promise.all([
      deleteBoardImages(board),
      asyncSQL("DELETE FROM Board WHERE b_id = ? AND b_uid = ?", [bid, uid]),
    ]);

    res.status(200).json({
      status: "success",
      message: "게시글이 삭제되었습니다.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생 했습니다.",
    });
  }
});

//메인 피드 최신순 게시글 6개
router.get("/get/main", async (req, res) => {
  let { userId, page, count } = req.query;
  if (!count) {
    count = 6;
  }
  if (!page || page < 1) {
    page = 0;
  }

  try {
    const rows = await asyncSQL(
      `SELECT 
        b.b_id as bid,
        b.b_comment as content,
        b.b_img as bimg,
        b.b_date as date,
        a.u_id as uid,
        a.u_img as uimg,
        a.u_email as email,
        (SELECT COUNT(*) FROM Follow WHERE f_following = ? AND f_follower = a.u_id) AS following,
        (SELECT COUNT(*) as count FROM \`b_Like\` WHERE bl_bid = bid AND bl_uid = ?) AS lk
      FROM Board b JOIN User a
      ON b.b_uid = a.u_id
      ORDER BY b_date DESC
      LIMIT ?, ?`,
      [parseInt(userId), parseInt(userId), page * count, count]
    );

    return res.status(200).json({
      status: "success",
      content: rows,
      nextPage: Number(page) + 1, // 다음 페이지 번호
      nextCount: Number(count), // 다음 페이지에 보여줄 개수
      following: rows[0].following, // 해당 작성자를 팔로우하고 있는지 여부
      lk: rows[0].lk,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생 하였습니다.",
    });
  }
});

// 특정 사용자의 글 조회
// select 사용자 닉네임 + 게시판 글 + 생성일자
// http://localhost:3000/boadrd/get?id=1
// http://localhost:3000/boadrd/get/1
router.get("/get/user/:uid", async (req, res) => {
  const { uid } = req.params;
  let { page, count } = req.query;
  if (!uid) {
    res.status(400).end();
    return;
  }
  if (!count) {
    count = 6;
  }
  if (!page || page < 1) {
    page = 0;
  }

  try {
    const rows = await asyncSQL(`
      SELECT 
        b.b_id as bid,
        b.b_comment as content,
        a.u_email as email,
        a.u_img as uimg,
        b.b_img as bimg,
        b.b_date as date
      FROM Board b JOIN User a
      ON b.b_uid = a.u_id
      WHERE b_uid = ?
      ORDER BY b_date DESC
      LIMIT ?, ?
    `, [uid, page * count, count]);

    res.status(200).json({
      status: "success",
      content: rows,
      nextPage: Number(page) + 1, // 다음 페이지 번호
      nextCount: Number(count), // 다음 페이지에 보여줄 개수
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

// 게시글 하나만 조회(댓글 보기에 사용)
router.get("/get/board/:bid", async (req, res) => {
  const { bid } = req.params;

  try {
    const rows = await asyncSQL(
      `
      SELECT
        b.b_id as bid,
        b.b_comment as content,
        b.b_img as bimg,
        b.b_date as date,
        u.u_img as uimg 
      FROM Board b JOIN User u
      ON b.b_uid = u.u_id
      WHERE b.b_id = ?
    `,
      [bid]
    );

    if (rows.length > 0) {
      res.status(200).json({
        status: "success",
        bid: rows[0].bid,
        content: rows[0].content,
        date: rows[0].date,
      });
    } else {
      res.status(404).json({
        status: "fail",
        message: "데이터가 없습니다.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생 하였습니다.",
    });
  }
});

//게시글 갯수 카운트
router.get("/get/count/:uid", async (req, res) => {
  const { uid } = req.params;
  if (!uid) {
    return res.status(400).end();
  }

  try {
    const rows = await asyncSQL(`
      SELECT COUNT(b_id) as count
      FROM Board
      WHERE b_uid = ?;
    `, [uid]);

    res.status(200).json({
      status: "success",
      count: rows[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생 하였습니다.",
    });
  }
});

//좋아요 추가
router.post("/like", async (req, res) => {
  const { uid, bid } = req.body;
  if (!uid || !bid) {
    return res.status(400).end();
  }

  try {
    const rows = await asyncSQL(`
      SELECT * FROM \`b_Like\` WHERE bl_bid=? AND bl_uid=?
    `, [bid, uid]);

    if (rows.length > 0) {
      // 이미 좋아요를 누른 경우
      return res.status(200).json({
        status: "fail",
        message: "이미 좋아요를 누르셨습니다.",
      });
    } else {
      // 좋아요를 누르지 않은 경우, 새로운 좋아요 등록
      await asyncSQL(`
        INSERT INTO \`b_Like\` (bl_bid, bl_uid) VALUES (?, ?)
      `, [bid, uid]);

      return res.status(201).json({
        status: "success",
        message: "좋아요가 등록되었습니다.",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생 했습니다.",
    });
  }
});

//좋아요 취소
router.delete("/like/:bid/:uid", async (req, res) => {
  const { bid, uid } = req.params;

  try {
    const result = await asyncSQL(
      `DELETE FROM b_Like
       WHERE bl_bid = ? AND bl_uid = ?`,
      [bid, uid]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        status: "fail",
        message: "좋아요를 누르지 않은 게시글입니다.",
      });
    } else {
      return res.status(200).json({
        status: "success",
        message: "좋아요가 취소되었습니다.",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생하였습니다.",
    });
  }
});

// 해당 게시글의 좋아요 여부 확인
router.get("/like/check", async (req, res) => {
  const { uid, bid } = req.query;
  if (!uid || !bid) {
    return res.status(400).end();
  }

  try {
    const [row] = await asyncSQL(
      `SELECT COUNT(*) as count FROM \`b_Like\` WHERE bl_bid = ? AND bl_uid = ?`,
      [bid, uid]
    );

    const isLiked = row.count > 0;
    res.status(200).json({
      status: "success",
      isLiked: isLiked,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생 했습니다.",
    });
  }
});

//게시글 좋아요 카운트
router.get("/like/count", async (req, res) => {
  const { bid } = req.query;
  if (!bid) {
    res.status(400).end();
  }

  try {
    const [row] = await asyncSQL(
      `SELECT COUNT(*) as count FROM \`b_Like\` WHERE bl_bid = ?`,
      [bid]
    );

    res.status(200).json({
      status: "success",
      count: row.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: "서버에서 에러가 발생 했습니다.",
    });
  }
});

module.exports = router;
