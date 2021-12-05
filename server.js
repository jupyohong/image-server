require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

const { PORT, MONGO_URI } = process.env;

const authenticator = require("./middlewares/authenticator");

const imageRouter = require("./routes/imageRouter");
const userRouter = require("./routes/userRouter");

// Access path: http://localhost:5000/file.jpg
app.use(express.static("./uploads"));
// Access path: http://localhost:5000/uploads/file.jpg
// app.use("uploads", express.static("./uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(authenticator);

// Connect to MongoDB Server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB!");
  })
  .catch((err) => {
    console.error(err);
    return res.status(500).json({ message: "DATABASE_ERROR" });
  });

// API Routing
app.use("/images", imageRouter);
app.use("/users", userRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(500).json({ message: err.message });
});

app.listen(PORT, () => console.log(`Express server listening on port ${PORT}`));
