const { S3 } = require("aws-sdk");
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const s3 = new S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "ap-northeast-2",
});

const getPresignedPost = (key) => {
  return new Promise((resolve, reject) => {
    s3.createPresignedPost(
      {
        Bucket: process.env.S3_BUCKET,
        Fields: {
          key: `test/${key}`,
        },
        Expires: 300,
        Conditions: [
          ["content-length-range", 0, 50 * 1000 * 1000], // 50 MB 제한
          ["starts-with", "$Content-Type", ""], // MIME 타입 기준 파일형식 제한
        ],
      },
      (err, data) => {
        if (err) reject(err);
        return resolve(data);
      }
    );
  });
};

const getPresigned = (key, ttl = 60) => {
  return new Promise((resolve, reject) => {
    try {
      s3.getSignedUrl(
        "getObject",
        { Bucket: process.env.S3_BUCKET, Key: `test/${key}`, Expires: ttl },
        (err, url) => {
          if (err) reject(err);
          return resolve(url);
        }
      );
    } catch (err) {}
  });
};

module.exports = { s3, getPresignedPost, getPresigned };
