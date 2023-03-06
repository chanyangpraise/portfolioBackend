// 해당 게시글의 좋아요 여부 확인
router.get("/like/check", (req, res) => {
  const { uid, bid } = req.query;
  if (!uid || !bid) {
    return res.status(400).end();
  }

  asyncSQL(`
    SELECT COUNT(*) as count FROM \`b_Like\` WHERE bl_bid = ${bid} AND bl_uid = ${uid}
  `)
    .then(([row]) => {
      const isLiked = row.count > 0;
      res.status(200).json({
        status: "success",
        isLiked: isLiked,
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
