const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true },
    sessions: [
      {
        createdAt: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", UserSchema);
