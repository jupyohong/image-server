const { Router } = require("express");
// const fsPromises = require("fs/promises");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");
const mime = require("mime-types");

const imageUploader = require("../middlewares/imageUploader");
const Image = require("../models/Image");
const { s3, getPresignedPost, getPresigned } = require("../aws");

const router = Router();

router.post("/presigned", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "UNAUTHORIZED" });
    const { contentTypes } = req.body;
    if (!Array.isArray(contentTypes)) throw new Error("BAD_REQUEST");

    const presignedData = await Promise.all(
      contentTypes.map(async (contentType) => {
        const imageKey = `${uuid()}.${mime.extension(contentType)}`;
        const presigned = await getPresignedPost(imageKey);
        return { imageKey, presigned };
      })
    );

    return res.status(200).json(presignedData);
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

router.get("/presigned/:key", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "UNAUTHORIZED" });
    const { key } = req.params;
    const url = await getPresigned(key);
    return res.status(200).json({ url });
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

router.post("/", imageUploader.array("images", 10), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "UNAUTHORIZED" });
    const { images, public } = req.body;
    const imageDocs = await Promise.all(
      images.map((image) =>
        new Image({
          user: {
            _id: req.user.id,
            username: req.user.username,
            nickname: req.user.nickname,
          },
          public,
          key: image.imageKey,
          originalFileName: image.originalFileName,
        }).save()
      )
    );
    return res.json(imageDocs);
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

// Get public images
router.get("/", async (req, res) => {
  try {
    // Last image ID for pagination
    const { lastId } = req.query;
    if (lastId && !mongoose.isValidObjectId(lastId)) {
      throw new Error("BAD_REQUEST");
    }
    const images = await Image.find(
      lastId
        ? {
            public: true,
            _id: { $lt: lastId },
          }
        : { public: true }
    )
      .sort({ _id: -1 })
      .limit(12);
    return res.json(images);
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

// Get specific image
router.get("/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;
    if (!mongoose.isValidObjectId(imageId)) {
      throw new Error("BAD_REQUEST");
    }
    const image = await Image.findOne({ _id: imageId });
    if (!image) {
      return res.status(404).json({ message: "NOT_FOUND" });
    }
    // Only the image uploader can access the private image
    if (!image.public && (!req.user || req.user.id !== image.user.id)) {
      return res.status(403).json({ message: "FORBIDDEN" });
    }
    return res.json(image);
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

router.delete("/:imageId", async (req, res) => {
  const { imageId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ message: "UNAUTHORIZED" });
    if (!mongoose.isValidObjectId(imageId)) {
      return res.status(400).json({ message: "BAD_REQUEST" });
    }
    const image = await Image.findOneAndDelete({ _id: imageId });
    if (!image) return res.status(404).json({ message: "NOT_FOUND" });
    // await fsPromises.unlink(`./uploads/${image.key}`);
    s3.deleteObject(
      { Bucket: process.env.S3_BUCKET, Key: `test/${image.key}` },
      (err, data) => {
        if (err) {
          console.error(err);
          throw new Error("INTERNAL_SERVER_ERROR");
        }
      }
    );
    return res.status(200).json();
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

router.patch("/:imageId/like", async (req, res) => {
  const { imageId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ message: "UNAUTHORIZED" });
    if (!mongoose.isValidObjectId(imageId)) {
      return res.status(400).json({ message: "BAD_REQUEST" });
    }
    /**
     * first param: filter which image to like
     * second param: update the image
     * third param: option
     */
    const image = await Image.findOneAndUpdate(
      { _id: imageId },
      { $addToSet: { likes: req.user.id } },
      { new: true } // give you the object after `update` was applied.
    );
    return res.status(200).json(image);
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

router.patch("/:imageId/unlike", async (req, res) => {
  const { imageId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ message: "UNAUTHORIZED" });
    if (!mongoose.isValidObjectId(imageId)) {
      return res.status(400).json({ message: "BAD_REQUEST" });
    }
    const image = await Image.findOneAndUpdate(
      { _id: imageId },
      { $pull: { likes: req.user.id } },
      { new: true }
    );
    return res.status(200).json(image);
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

module.exports = router;
