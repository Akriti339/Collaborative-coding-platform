const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const connectDB = require("./config/db");
const Room = require("./models/Room");
const TIME_LIMIT = 2000; // 2 seconds

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const Problem = require("./models/Problem");

app.get("/problems", async (req, res) => {
  try {
    const problems = await Problem.find();

    res.json(problems);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Error fetching problems",
    });
  }
});

app.get("/problems/:id", async (req, res) => {
  try {
    const problem = await Problem.findById(
      req.params.id
    );

    res.json(problem);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching problem",
    });
  }
});
app.get("/", (req, res) => {
  res.send("Collaborative Coding Backend Running");
});

app.post("/save-room", async (req, res) => {
  try {
    const {
      roomId,
      code,
      language,
      problem,
      testCases,
    } = req.body;

    const room = await Room.findOneAndUpdate(
      { roomId },
      {
        roomId,
        code,
        language,
        problem,
        testCases,
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.json(room);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Error",
    });
  }
});

app.get("/room/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({
      roomId: req.params.roomId,
    });

    res.json(room);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Error",
    });
  }
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined ${roomId}`);
  });

  socket.on("code-change", ({ roomId, code }) => {
    console.log("Code change received for room:", roomId);
    socket.to(roomId).emit("receive-code", code);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

app.post("/run", async (req, res) => {
  try {
    const { code, language, input } = req.body;

    console.log("RUN REQUEST RECEIVED");
    console.log("Language:", language);
    console.log("Input:", input);

    const tempDir = path.join(__dirname, "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const id = uuidv4();

    // ==========================
    // C++
    // ==========================
    if (language === "cpp") {
      const filePath = path.join(tempDir, `${id}.cpp`);

      fs.writeFileSync(filePath, code);
      const command = `docker run --rm --memory=128m --cpus=1 -v "${tempDir}:/app" gcc bash -c "g++ /app/${id}.cpp -o /app/${id} && echo '${input || ""}' | /app/${id}"`;

      console.log("Running command:");
      console.log(command);

      const startTime = Date.now();
      exec(command, { timeout: TIME_LIMIT }, (error, stdout, stderr) => {
        console.log("STDOUT:", stdout);
        console.log("STDERR:", stderr);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        const exePath = path.join(tempDir, id);

        if (fs.existsSync(exePath)) {
          fs.unlinkSync(exePath);
        }
        if (error && error.killed) {
          return res.json({
            output: "Time Limit Exceeded",
            executionTime: TIME_LIMIT,
            status: "TLE",
          });
        }
        if (
          stderr &&
          (stderr.includes("Killed") ||
          stderr.includes("OOM"))
        ) {
          return res.json({
            output: "Memory Limit Exceeded",
            status: "MLE",
          });
        }
        if (
          error &&
          !stdout &&
          stderr.includes("error:")
        ) {
          return res.json({
            output: stderr,
            status: "CE",
          });
        }
        if (error) {
          // console.log("ERROR:", error);

          return res.json({
          output: stderr || error.message,
          status: "RE",
        });
        }

        const endTime = Date.now();

        res.json({
          output: stdout || "No Output",
          executionTime: endTime - startTime,
          status: "OK",
        });
      });
    }

    // ==========================
    // Python
    // ==========================
    else if (language === "python") {
      const filePath = path.join(tempDir, `${id}.py`);

      fs.writeFileSync(filePath, code);
      const command = `docker run --rm --memory=128m --cpus=1 -v "${tempDir}:/app" python:3.10 bash -c "echo '${input || ""}' | python /app/${id}.py"`;

      console.log("Running command:");
      console.log(command);

      const startTime = Date.now();
      exec(command, { timeout: TIME_LIMIT }, (error, stdout, stderr) => {
        console.log("STDOUT:", stdout);
        console.log("STDERR:", stderr);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        // TLE
        if (error && error.killed) {
          return res.json({
            output: "Time Limit Exceeded",
            executionTime: TIME_LIMIT,
            status: "TLE",
          });
        }
        // MLE
        if (
          stderr &&
          (stderr.includes("Killed") ||
          stderr.includes("OOM"))
        ) {
          return res.json({
            output: "Memory Limit Exceeded",
            status: "MLE",
          });
        }
        // compile error
        if (
          stderr &&
          (
            stderr.includes("SyntaxError") ||
            stderr.includes("IndentationError") ||
            stderr.includes("TabError")
          )
        )
        {
          return res.json({
            output: stderr,
            status: "CE",
          });
        }
        if (error) {
          // console.log("ERROR:", error);
          return res.json({
          output: stderr || error.message,
          status: "RE",
        });
        }

        const endTime = Date.now();

        res.json({
          output: stdout || "No Output",
          executionTime: endTime - startTime,
          status: "OK",
        });
      });
    } else {
      res.json({
        output: "Unsupported language",
        status: "UNSUPPORTED",
      });
    }
  } catch (err) {
    console.log("SERVER ERROR:", err);

    res.json({
      output: "Execution Error",
      status: "SERVER_ERROR",
    });
  }
});

connectDB();
server.listen(5000, () => {
  console.log("Server running on port 5000");
});