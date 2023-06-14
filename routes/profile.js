const express = require("express");
const asyncSQL = require("../functions/db");

const router = express.Router();

// 프로필 조회
// 이메일, 팔로워, 팔로잉
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
      FROM User
      WHERE u_id = ?`, [uid]);

    if (rows.length === 0) {
      return res.status(200).json({
        status: "fail",
        message: "사용자가 존재하지 않습니다.",
      });
    }

    const rows1 = await asyncSQL(`
      SELECT
        COUNT(f_follower) as follower
      FROM Follow
      WHERE f_following = ?`, [uid]);

    const rows2 = await asyncSQL(`
      SELECT
        COUNT(f_following) as following
      FROM Follow
      WHERE f_follower = ?`, [uid]);

    const rows3 = await asyncSQL(`
      SELECT
        f_id
      FROM Follow
      WHERE f_follower = ? AND f_following = ?`, [uid, getId]);

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

// 팔로워 조회
// 한번에 10개 씩, 페이징
router.get("/follower/:uid", (req, res) => {
  const { uid } = req.params;
  let { page, count } = req.query;
  if (!uid) res.status(400).end();
  if (!page) page = 0;
  if (!count) count = 10;

  asyncSQL(`
    SELECT
      u.u_id,
      u.u_email,
      u.u_img
    FROM Follow f JOIN User u
    ON f.f_follower = u.u_id
    WHERE f_following = ?
    ORDER BY u.u_email
    LIMIT ?, ?;`, [uid, page * count, count])
    .then((rows) => {
      res.status(200).json({
        status: "success",
        follower: rows,
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

// 팔로잉 조회
router.get("/following/:uid", (req, res) => {
  const { uid } = req.params;
  let { page, count } = req.query;
  if (!uid) res.status(400).end();
  if (!page) page = 0;
  if (!count) count = 10;

  asyncSQL(`
    SELECT
      u.u_id,
      u.u_email,
      u.u_img
    FROM Follow f JOIN User u
    ON f.f_following = u.u_id
    WHERE f_follower = "${uid}"
    ORDER BY u.u_email
    LIMIT ${page * count}, ${count}
  `)
    .then((rows) => {
      res.status(200).json({
        status: "success",
        following: rows,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생하였습니다.",
      });
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    });
});

// 팔로우 하기
// 내가 팔로우 -> ing
router.post("/follow", (req, res) => {
  const { follower, following } = req.body;
  if (!follower || !following) {
    return res.status(400).end();
  }

  asyncSQL(
    `
      SELECT
        f_id
      FROM Follow
      WHERE f_follower = "${follower}" 
        AND f_following = "${following}";
    `
  )
    .then((rows) => {
      if (rows.length === 0) {
        asyncSQL(`
        INSERT INTO 
          Follow (f_follower, f_following)
        VALUES
          ("${follower}", "${following}")
        `)
          .then(() => {
            res.status(200).json({
              status: "success",
              message: "성공되었습니다.",
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
        res.status(200).json({
          status: "fail",
          message: "이미 팔로우입니다.",
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

// 팔로우 취소
router.delete("/unfollow", (req, res) => {
  const { follower, following } = req.query;
  if (!follower || !following) {
    return res.status(400).end();
  }

  asyncSQL(
    `DELETE FROM Follow WHERE f_follower = "${follower}" AND f_following = "${following}";`
  )
    .then(() => {
      res.status(200).json({
        status: "success",
        message: "성공되었습니다.",
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

// //팔로워 카운트
// router.get("/follower/count/:uid", (req, res) => {
//   const { uid } = req.params;
//   if (!uid) res.status(400).end();

//   asyncSQL(
//     `
//     SELECT COUNT(*) AS count
//     FROM follow
//     WHERE f_following = ${uid}
//   `
//   )
//     .then((rows) => {
//       res.status(200).json({
//         status: "success",
//         count: rows[0].count,
//       });
//     })
//     .catch((err) => {
//       res.status(500).json({
//         status: "fail",
//         message: "서버에서 에러가 발생 하였습니다.",
//       });
//       if (process.env.NODE_ENV === "development") {
//         console.error(err);
//       }
//     });
// });

// //팔로잉 카운트
// router.get("/following/count/:uid", (req, res) => {
//   const { uid } = req.params;
//   if (!uid) res.status(400).end();

//   asyncSQL(`
//     SELECT COUNT(*) AS count
//     FROM follow
//     WHERE f_follower = ${uid}
//   `)
//     .then((rows) => {
//       res.status(200).json({
//         status: "success",
//         count: rows[0].count,
//       });
//     })
//     .catch((err) => {
//       res.status(500).json({
//         status: "fail",
//         message: "서버에서 에러가 발생 하였습니다.",
//       });
//       if (process.env.NODE_ENV === "development") {
//         console.error(err);
//       }
//     });
// });

module.exports = router;
