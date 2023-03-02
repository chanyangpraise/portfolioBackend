router.get("/get/board/:bid/:uid", (req, res) => {
  const { bid, uid } = req.params;

  asyncSQL(
    `
    SELECT
      b.b_id as bid,
      b.b_comment as content,
      b.b_img as bimg,
      b.b_date as date,
      u.u_img as uimg,
      IFNULL(l.bl_bid, 0) as isLiked 
    FROM Board b JOIN User u
    ON b.b_uid = u.u_id
    LEFT JOIN b_Like l
    ON b.b_id = l.bl_bid AND l.bl_uid = "${uid}"
    WHERE b.b_id = "${bid}"
  `,
    (err, rows) => {
      if (err) {
        res.status(500).json({
          status: "fail",
          message: "서버에서 에러가 발생 하였습니다.",
        });
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
      } else if (rows.length > 0) {
        res.status(200).json({
          status: "success",
          bid: rows[0].bid,
          content: rows[0].content,
          date: rows[0].date,
          isLiked: rows[0].isLiked ? true : false,
        });
      } else {
        res.status(200).json({
          status: "fail",
          message: "데이터가 없습니다.",
        });
      }
    }
  );
});

router.post("/like", (req, res) => {
  const { uid, bid } = req.body;
  if (!uid || !bid) {
    return res.status(400).end();
  }

  asyncSQL(`
    INSERT INTO \`b_Like\` (bl_bid, bl_uid) VALUES ("${bid}", "${uid}")
  `)
    .then(() => {
      asyncSQL(`
        UPDATE Board SET b_like = "${uid}" WHERE b_id = "${bid}"
      `)
        .then(() => {
          res.status(201).json({
            status: "success",
            message: "좋아요가 등록되었습니다.",
          });
        })
        .catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error(err);
          }
          res.status(500).json({
            status: "fail",
            message: "서버에서 에러가 발생 했습니다.",
          });
        });
    })
    .catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
      res.status(500).json({
        status: "fail",
        message: "서버에서 에러가 발생 했습니다.",
      });
    });
});
