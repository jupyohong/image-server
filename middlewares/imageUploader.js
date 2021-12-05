const multer = require("multer");
const { v4: uuid } = require("uuid");
const mime = require("mime-types");
const multerS3 = require("multer-s3");
const { s3 } = require("../aws");

const FILE_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 1024 * 1024 * 10;

// Local disk storage
const distStorage = multer.diskStorage({
  // The folder to which the file has benn saved
  destination: (req, file, cb) => cb(null, "./uploads"),
  // The name of the file within the `destination`
  filename: (req, file, cb) => {
    cb(null, `${uuid()}.${mime.extension(file.mimetype)}`);
  },
});

// AWS S3
const storage = multerS3({
  s3,
  bucket: "image-upload-test-coconutsilo",
  key: (req, file, cb) =>
    cb(null, `raw/${uuid()}.${mime.extension(file.mimetype)}`),
});

const uploader = multer({
  storage,
  // Function to control which files are accepted
  fileFilter: (req, file, cb) => {
    if (FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("INVALID_FILE_TYPE"), false);
    }
  },
  // Limits of the uploaded data
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = uploader;
