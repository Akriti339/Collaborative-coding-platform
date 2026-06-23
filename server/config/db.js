const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb://akriti:akriti123@ac-iopwbrf-shard-00-00.5djqvv0.mongodb.net:27017,ac-iopwbrf-shard-00-01.5djqvv0.mongodb.net:27017,ac-iopwbrf-shard-00-02.5djqvv0.mongodb.net:27017/collabcode?ssl=true&replicaSet=atlas-e6nrq2-shard-0&authSource=admin&retryWrites=true&w=majority"
    );

    console.log("MongoDB Connected");
  } catch (err) {
    console.log("Mongo Error:");
  console.log(err);
  }
};

module.exports = connectDB;