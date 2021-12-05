const { Router } = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Image = require("../models/Image");

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = await new User({
      username: req.body.username,
      password: hashed,
      nickname: req.body.nickname,
      sessions: [{ createdAt: new Date() }],
    }).save();
    const session = user.sessions[user.sessions.length - 1];
    return res.json({ message: "success", sessionId: session._id });
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

router.patch("/signin", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: "Invalid signin info :(" });
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid signin info :(" });
  }
  user.sessions.push({ createdAt: new Date() });
  const session = user.sessions[user.sessions.length - 1];
  await user.save();
  return res.status(200).json({
    message: "success",
    sessionId: session._id,
    nickname: user.nickname,
  });
});

router.patch("/signout", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "UNAUTHORIZED" });
    await User.updateOne(
      { _id: req.user.id },
      { $pull: { sessions: { _id: req.headers.sessionid } } }
    );
    return res.status(200).json({ message: "Good bye" });
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

router.get("/profile", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "UNAUTHORIZED" });
    return res.status(200).json({
      message: "success",
      username: req.user.username,
      sessionId: req.headers?.sessionid,
      nickname: req.user.nickname,
    });
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

// Get my images
router.get("/images", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "UNAUTHORIZED" });
    // Last image ID for pagination
    const { lastId } = req.query;
    if (lastId && !mongoose.isValidObjectId(lastId)) {
      throw new Error("BAD_REQUEST");
    }
    // Values being compared must be string
    const images = await Image.find(
      lastId
        ? { "user._id": req.user.id, _id: { $lt: lastId } }
        : { "user._id": req.user.id }
    )
      .sort({ _id: -1 })
      .limit(12);
    return res.status(200).json(images);
  } catch (err) {
    console.error(err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
});

module.exports = router;
