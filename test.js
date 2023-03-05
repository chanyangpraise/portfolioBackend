//게시글 삭제
router.delete("/delete/:bid", async (req, res) => {
  const bid = req.params.bid;
  const uid = req.query.uid;

  try {
    const rows = await asyncSQL(`SELECT * FROM Board WHERE b_id=${bid} AND b_uid=${uid}`);
    if (rows.length < 1) {
      return res.status(404).json({
        status: "fail",
        message: "해당 게시글을 찾을 수 없습니다.",
      });
    }
    
    await asyncSQL(`DELETE FROM b_Like WHERE bl_bid=${bid}`);
    await asyncSQL(`DELETE FROM Comment WHERE c_bid=${bid}`);

    const board = { b_img: rows[0].b_img.split("/").pop() };
    await Promise.all([
      deleteBoardImages(board),
      asyncSQL(`DELETE FROM Board WHERE b_id=${bid} AND b_uid=${uid}`),
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