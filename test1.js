//메인 피드 최신순 게시글 6개
router.get("/get/main", async (req, res) => {
  let { userId, page, count } = req.query;
  if (!count) {
    count = 6;
  }
  if (!page || page < 1) {
    page = 0;
  }

  await asyncSQL(`
  SELECT 
    b.b_id as bid,
    b.b_comment as content,
    b.b_img as bimg,
    b.b_date as date,
    a.u_id as uid,
    a.u_img as uimg,
    a.u_email as email,
    (SELECT COUNT(*) FROM Follow WHERE f_follower = '${parseInt(userId)}' 
    AND f_following = a.u_id) AS following,
    (SELECT COUNT(*) as count FROM \`b_Like\` WHERE bl_bid = bid AND bl_uid = '${parseInt(
      userId
    )}') AS lk
  FROM Board b JOIN User a
  ON b.b_uid = a.u_id
  ORDER BY b_date DESC
  LIMIT ${page * count}, ${count}
`)
    .then((rows) => {
      return res.status(200).json({
        status: "success",
        content: rows,
        nextPage: Number(page) + 1, // 다음 페이지 번호
        nextCount: Number(count), // 다음 페이지에 보여줄 개수
        following: rows[0].following, // 해당 작성자를 팔로우하고 있는지 여부
        lk: rows[0].lk,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생 하였습니다.",
      });
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    });
});

router.get("/get/:bid", (req, res) => {
  const { bid } = req.params;
  let { page, count } = req.query;
  if (!bid) {
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
      c.c_id as cid,
      u.u_id as uid,
      u.u_img as uimg,
      u.u_email as email,
      c.c_comment as content,
      c.c_date as date
    FROM Comment c JOIN User u
    ON c.c_uid = u.u_id
    WHERE c_bid = "${bid}"
    ORDER BY c.c_date DESC
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