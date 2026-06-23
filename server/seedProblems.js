const mongoose = require("mongoose");
const Problem = require("./models/Problem");
const fs = require("fs");
async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb://akriti:akriti123@ac-iopwbrf-shard-00-00.5djqvv0.mongodb.net:27017,ac-iopwbrf-shard-00-01.5djqvv0.mongodb.net:27017,ac-iopwbrf-shard-00-02.5djqvv0.mongodb.net:27017/collabcode?ssl=true&replicaSet=atlas-e6nrq2-shard-0&authSource=admin&retryWrites=true&w=majority"
    );

    console.log("MongoDB Connected");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

async function seed() {
  await connectDB();

  const problems = JSON.parse(
    fs.readFileSync("./problems.json", "utf8")
  );

  await Problem.deleteMany({});

  await Problem.insertMany(problems);

  console.log(`${problems.length} Problems Added`);

  process.exit();
}

seed();