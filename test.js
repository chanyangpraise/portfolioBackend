router.get("/get/:uid", async (req, res) => {
    const { uid } = req.params;
    let { page, count } = req.query;
    if (!uid) {
      res.status(400).end();
    }
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
          b.b_timg as thumbnail,
          b.b_date as date
        FROM Board b JOIN user a
        ON b.b_uid = a.u_id
        WHERE b_uid = "${uid}"
        ORDER BY b_date DESC
        LIMIT ${page * count}, ${count}`
      );
      res.status(200).json({
        status: "success",
        content: rows,
        nextPage: Number(page) + 1, // 다음 페이지 번호
        nextCount: Number(count), // 다음 페이지에 보여줄 개수
      });
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
  