const mongoose = require("mongoose");
const User = require("../models/User");

const authenticator = async (req, res, next) => {
  try {
    const { sessionid } = req.headers;
    if (!sessionid || !mongoose.isValidObjectId(sessionid)) return next();
    const user = await User.findOne({ "sessions._id": sessionid });
    if (!user) return next();
    req.user = user;
    return next();
  } catch (err) {
    console.error(err);
    throw new Error("UNAUTHORIZED");
  }
};

module.exports = authenticator;
