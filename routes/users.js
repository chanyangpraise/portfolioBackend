const express = require("express");
const { sendMail, randomNumber } = require("../functions/mail");
const asyncSQL = require("../functions/db");
const upload = require("../functions/multer");
const { encrypt } = require("../functions/encrypt");
const router = express.Router();

//이메일 인증
router.get("/", (req, res) => {
  res.send("respond with a resource");
});

router.post("/auth_mail", (req, res) => {
  const { email } = req.body;
  const rnd = randomNumber();

  asyncSQL(
    `INSERT INTO auth (a_email, a_digit) VALUES ("${email}", "${rnd}");`,
    (err, rows) => {
      if (err || rows.affectedRows < 1) {
        res.status(500).json({
          status: "fail",
          message: "서버에서 에러가 발생 했습니다.",
        });
      } else {
        sendMail(email, rnd, (err1) => {
          if (err1) {
            res.status(500).json({
              status: "fail",
              message: "서버에서 에러가 발생 하였습니다.",
            });
          } else {
            res.status(201).json({
              status: "success",
              message: "성공되었습니다.",
            });
          }
        });
      }
    }
  );
});

//이메일 인증
router.get("/auth_valid", (req, res) => {
  const { email, digit } = req.query;
  asyncSQL(
    `SELECT a_id, a_digit FROM auth WHERE a_email = "${email}" AND a_is_used = 0 ORDER BY a_id DESC LIMIT 1`,
    (err, rows) => {
      console.log(rows);
      if (err || rows.length < 1) {
        res
          .status(500)
          .json({ status: "fail", message: "서버에서 오류가 발생했습니다." });
      } else if (digit.toString() === rows[0].a_digit.toString()) {
        asyncSQL(
          `UPDATE auth SET a_is_used = 1 WHERE a_id = ${rows[0].a_id}`,
          (err1, rows1) => {
            if (err1 || rows1.affectedRows < 1) {
              res.status(500).json({
                status: "fail",
                message: "서버에서 에러가 발생했습니다.",
              });
            } else {
              res.status(200).json({
                status: "success",
                message: "일치합니다.",
              });
            }
          }
        );
      } else {
        res.status(200).json({ status: "fail", message: "일치하지 않습니다." });
      }
    }
  );
});

//동일한 이메일이 있을때 가입 X
router.post("/register", (req, res) => {
  const { email, pwd, phone } = req.body;
  const encryptPwd = encrypt(pwd);

  asyncSQL(
    `SELECT u_email FROM user WHERE u_email = "${email}"`,
    (err, rows) => {
      if (err) {
        console.log("1번 select");
        console.log(err);
        res.status(500).json({
          status: "fail",
          message: "서버에서 에러가 발생 하였습니다.",
        });
      } else if (rows.length > 0) {
        res.status(200).json({
          status: "fail",
          message: "이미 가입된 이메일이 있습니다.",
        });
      } else {
        asyncSQL(
          `INSERT INTO user (u_email, u_password, u_phone) VALUES ("${email}", "${encryptPwd}", "${phone}");`,
          (err1, rows1) => {
            if (err1 || rows1.affectedRows < 1) {
              console.log("2번 select");
              console.log(err1);
              res.status(500).json({
                status: "fail",
                message: "서버에서 에러가 발생 하였습니다.",
              });
            } else {
              res.status(201).json({
                status: "success",
                message: "성공되었습니다.",
              });
            }
          }
        );
      }
    }
  );
});

//로그인
router.post("/login", (req, res) => {
  const { email, pwd } = req.body;
  const encryptPwd = encrypt(pwd);

  asyncSQL(
    `SELECT u_id, u_password, u_img FROM user WHERE u_email = "${email}";`,
    (err, rows) => {
      if (err) {
        res.status(500).json({
          status: "fail",
          message: "서버에서 에러가 발생 하였습니다.",
        });
      } else if (rows.length > 0) {
        if (rows[0].u_password === encryptPwd) {
          res.status(200).json({
            status: "success",
            message: "로그인 성공",
            info: {
              id: rows[0].u_id,
              uimg: rows[0].u_img,
            },
          });
        } else {
          res.status(200).json({
            status: "fail",
            message: "비밀번호를 찾을 수 없습니다.",
          });
        }
      } else {
        res.status(200).json({
          status: "fail",
          message: "이메일을 찾을 수 없습니다.",
        });
      }
    }
  );
});

// 비밀번호 변경하기.
// 1. 에러가 발생 할 때
// 2. 기존 비밀번호랑 일치하는지
// 3. 이메일을 찾을 수 없을 때
router.put("/changePwd", (req, res) => {
  const { email, pwd } = req.body;
  if (!email || !pwd) {
    res.status(400).json({
      status: "fail",
    });
  }
  const encryptPwd = encrypt(pwd);

  asyncSQL(
    `SELECT u_password FROM user WHERE u_email = "${email}"`,
    (err, rows) => {
      if (err) {
        console.log(err);
        res.status(500).json({
          status: "fail",
          message: "서버에서 에러가 발생 하였습니다.",
        });
      }
      if (rows.length > 0) {
        if (encryptPwd === rows[0].u_password) {
          res.status(200).json({
            status: "fail",
            message: "기존 비밀번호와 일치 합니다.",
          });
        } else {
          asyncSQL(
            `UPDATE user SET u_password = "${encryptPwd}" WHERE u_email = "${email}"`,
            (err1, rows1) => {
              if (err1) {
                console.log(err1);
                res.status(500).json({
                  status: "fail",
                  message: "서버에서 에러가 발생 하였습니다.",
                });
              } else if (rows1.affectedRows > 0) {
                res.status(200).json({
                  status: "success",
                  message: "성공적으로 바뀌었습니다.",
                });
              } else {
                res.status(200).json({
                  status: "fail",
                  message: "이메일을 찾을 수 없습니다.",
                });
              }
            }
          );
        }
      } else {
        res.status(200).json({
          status: "fail",
          message: "이메일을 찾을 수 없습니다.",
        });
      }
    }
  );
});

//프로필 이미지 받기
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { filename } = req.file;
    const { userId } = req.body;

    // u_img 칼럼을 업데이트하는 SQL 쿼리
    const sql = "UPDATE user SET u_img = ? WHERE id = ?";
    const result = await db.query(sql, [filename, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "사용자가 존재하지 않습니다" });
    }

    res.status(200).json({ message: "프로필 이미지 업로드 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

//프로필 이미지 수정
router.put(
  "/profile-image/:userId",
  upload.single("image"),
  async (req, res) => {
    try {
      const { filename } = req.file;
      const { userId } = req.params;

      // 이전 프로필 이미지 삭제
      const sql = "SELECT u_img FROM user WHERE id = ?";
      const [rows] = await db.query(sql, userId);

      if (rows.length === 0) {
        return res.status(404).json({ message: "사용자가 존재하지 않습니다" });
      }

      await deleteProfileImage(rows[0]);

      // 새로운 프로필 이미지 업데이트
      const updateSql = "UPDATE user SET u_img = ? WHERE id = ?";
      const result = await db.query(updateSql, [filename, userId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "사용자가 존재하지 않습니다" });
      }

      res.status(200).json({ message: "프로필 이미지 수정 성공" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "서버 오류" });
    }
  }
);

//프로필 이미지 삭제
router.delete("/profile-image/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 사용자 정보를 가져오는 SQL 쿼리
    const selectUserSql = "SELECT u_img FROM user WHERE id = ?";
    const [rows] = await db.query(selectUserSql, userId);

    if (rows.length === 0) {
      return res.status(404).json({ message: "사용자가 존재하지 않습니다" });
    }

    const user = rows[0];

    // u_img를 null로 업데이트하는 SQL 쿼리
    const updateSql = "UPDATE user SET u_img = null WHERE id = ?";
    await db.query(updateSql, userId);

    // S3에서 이미지 삭제
    await deleteProfileImage(user);

    res.status(200).json({ message: "프로필 이미지 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
