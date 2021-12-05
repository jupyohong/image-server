const { S3 } = require("aws-sdk");
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const s3 = new S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "ap-northeast-2",
});

const getSignedUrl = (key) => {
  return new Promise((resolve, reject) => {
    s3.createPresignedPost(
      {
        Bucket: "image-upload-test-coconutsilo",
        Fields: {
          key,
        },
        Expires: 300,
        Conditions: [
          ["content-length-range", 0, 50 * 1000 * 1000],
          ["starts-with", "$Content-Type", "image/"],
        ],
      },
      (err, data) => {
        if (err) reject(err);
        return resolve(data);
      }
    );
  });
};

module.exports = { s3, getSignedUrl };
