const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 게시물 이미지 삭제
async function deleteBoardImages(board) {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Delete: {
      Objects: [{ Key: board.b_img }, { Key: board.b_timg }],
    },
  };
  await s3Client.send(new DeleteObjectCommand(params));
}

// 프로필 이미지 삭제
async function deleteProfileImage(user) {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: user.u_img,
  };
  await s3Client.send(new DeleteObjectCommand(params));
}

module.exports = { deleteBoardImages, deleteProfileImage };
