import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import socket from "../socket/socket";
import axios from "axios";

function EditorPage() {
  const { roomId, id } = useParams();
  console.log("Problem ID:", id);
  const [code, setCode] = useState(`#include <iostream>

using namespace std;

int main() {
    
    return 0;
}`);

  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [executionTime, setExecutionTime] = useState(0);
  const [summary, setSummary] = useState("Not Run");
  const [passedCount, setPassedCount] = useState(0);

  const [problem, setProblem] = useState({
    title: "Square Number",
    description: "Given an integer N, print N².",
    inputFormat: "A single integer N.",
    outputFormat: "Print N².",
    constraints: "1 <= N <= 10^9",
  });

  const [testCases, setTestCases] = useState([
    {
      input: "",
      expectedOutput: "",
    },
  ]);

  const [testResult, setTestResult] = useState("");

  // Join Room
  useEffect(() => {
    socket.emit("join-room", roomId);
  }, [roomId]);
  // Load Room Data
useEffect(() => {
  const loadRoom = async () => {
    try {
      const res = await axios.get(
        `https://collaborative-coding-platform-fdct.onrender.com/room/${roomId}`
      );

      if (!res.data) return;

      setCode(res.data.code || "");
      setLanguage(res.data.language || "cpp");

      if (!id && res.data.problem) {
        setProblem(res.data.problem);
      }

      if (res.data.testCases) {
        setTestCases(res.data.testCases);
      }
    } catch (err) {
      console.log(err);
    }
  };

  loadRoom();
}, [roomId]);

useEffect(() => {
  if (!id) return;

  axios
    .get(`https://collaborative-coding-platform-fdct.onrender.com/problems/${id}`)
    .then((res) => {
      setProblem(res.data);
    })
    .catch((err) => {
      console.log(err);
    });
}, [id]);

  // Auto Save Room
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      await axios.post(
        "https://collaborative-coding-platform-fdct.onrender.com/save-room",
        {
          roomId,
          code,
          language,
          problem,
          testCases,
        }
      );

      console.log("Room Saved");
    } catch (err) {
      console.log(err);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [
  roomId,
  code,
  language,
  problem,
  testCases,
]);


  // Receive code updates
  useEffect(() => {
    socket.on("receive-code", (incomingCode) => {
      setCode(incomingCode);
    });

    return () => {
      socket.off("receive-code");
    };
  }, []);

  // Send code updates
  const handleCodeChange = (value) => {
    const newCode = value || "";

    setCode(newCode);

    socket.emit("code-change", {
      roomId,
      code: newCode,
    });
  };

  // Run Code
  const runCode = async () => {
    try {
      setOutput("Running...");

      const response = await axios.post(
        "https://collaborative-coding-platform-fdct.onrender.com/run",
        {
          code,
          language,
          input: testCases[0]?.input || "",
        }
      );

      setOutput(response.data.output);
      setExecutionTime(response.data.executionTime || 0);
    } catch (error) {
      console.error(error);
      setOutput("Error running code");
    }
  };

  // Run All Test Cases
  const runTestCase = async () => {
    try {
      setTestResult("Running Tests...\n");

      let results = "";
      let passed = 0;

      for (let i = 0; i < testCases.length; i++) {

        const test = testCases[i];

        const response = await axios.post(
         "https://collaborative-coding-platform-fdct.onrender.com/run",
          {
            code,
            language,
            input: test.input,
          }
        );
        const verdict = response.data.status;
        const time = response.data.executionTime || 0;

        if (verdict === "TLE") {
          results += `⏰ Test ${i + 1}: Time Limit Exceeded\n\n`;
          continue;
        }

        if (verdict === "MLE") {
          results += `💾 Test ${i + 1}: Memory Limit Exceeded\n\n`;
          continue;
        }

        if (verdict === "CE") {
          results += `⚠️ Test ${i + 1}: Compile Error\n`;
          results += `${response.data.output}\n\n`;
          continue;
        }

        if (verdict === "RE") {
          results += `🔥 Test ${i + 1}: Runtime Error\n`;
          results += `${response.data.output}\n\n`;
          continue;
        }

        const actualOutput = response.data.output.trim();
        const expectedOutput = test.expectedOutput.trim();

        if (actualOutput === expectedOutput) {
          passed++;
          results += `✅ Test ${i + 1}: Accepted (${time} ms)\n`;
        } else {
          results +=
            `❌ Test ${i + 1}: Wrong Answer (${time} ms)\n` +
            `Expected: ${expectedOutput}\n` +
            `Got: ${actualOutput}\n\n`;
        }
      }
      results =
        `Passed ${passed}/${testCases.length} Test Cases\n\n` +
        results;
      setSummary(
        `${passed}/${testCases.length} Passed`
      );  
      setPassedCount(passed);
      setTestResult(results);
    } catch (error) {
      console.error(error);
      setTestResult("❌ Test Execution Error");
    }
  };

  return (
    <div className="h-screen">

      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">

        <div className="flex items-center gap-4">
          <span>Room ID: {roomId}</span>

          <select
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value)
            }
            className="bg-slate-800 text-white px-3 py-2 rounded border border-slate-600"
          >
            <option value="cpp">⚡ C++</option>
            <option value="python">🐍 Python</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                await axios.post(
                  "https://collaborative-coding-platform-fdct.onrender.com/save-room",
                  {
                    roomId,
                    code,
                    language,
                    problem,
                    testCases,
                  }
                );

                alert("Room Saved");
              } catch (err) {
                alert("Save Failed");
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
          >
            Save Room
          </button>
          <button
            onClick={runCode}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Run Code
          </button>

          <button
            onClick={runTestCase}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Run Test
          </button>
        </div>
      </div>

      {/* Problem + Editor */}
<div className="h-[55vh] grid grid-cols-3">

  {/* Problem Panel */}
  <div className="bg-slate-900 text-white p-4 overflow-auto border-r border-gray-700">

    <h1 className="text-2xl font-bold mb-4">
      {problem.title}
    </h1>

    <h2 className="font-semibold mb-2">
      Description
    </h2>

    <p className="mb-4">
      {problem.description}
    </p>

    <h2 className="font-semibold mb-2">
      Input Format
    </h2>

    <p className="mb-4">
      {problem.inputFormat}
    </p>

    <h2 className="font-semibold mb-2">
      Output Format
    </h2>

    <p className="mb-4">
      {problem.outputFormat}
    </p>

    <h2 className="font-semibold mt-4 mb-2">
      Constraints
    </h2>

    <p>
      {problem.constraints}
    </p>

    {problem.examples?.length > 0 && (
      <>
        <h2 className="font-semibold mt-4 mb-2">
          Examples
        </h2>

        {problem.examples.map((example, index) => (
          <div
            key={index}
            className="bg-slate-800 p-3 rounded mb-3"
          >
            <p className="font-semibold">
              Example {index + 1}
            </p>

            <p className="mt-2">
              <strong>Input:</strong>
            </p>

            <pre className="bg-black p-2 rounded mt-1">
              {example.input}
            </pre>

            <p className="mt-2">
              <strong>Output:</strong>
            </p>

            <pre className="bg-black p-2 rounded mt-1">
              {example.output}
            </pre>
          </div>
        ))}
      </>
    )}

  </div>

  {/* Editor */}
  <div className="col-span-2">
    <MonacoEditor
      height="100%"
      language={language}
      value={code}
      onChange={handleCodeChange}
      theme="vs-dark"
    />
  </div>

</div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 h-[45vh]">

        {/* Test Cases */}
        <div className="bg-slate-800 p-3 border-r border-gray-700 overflow-auto">

          <button
            onClick={() =>
              setTestCases([
                ...testCases,
                {
                  input: "",
                  expectedOutput: "",
                },
              ])
            }
            className="bg-purple-600 px-3 py-2 rounded text-white mb-4"
          >
            Add Test Case
          </button>

          {testCases.map((test, index) => (
  <div
    key={index}
    className="mb-4 border-b border-gray-700 pb-3"
  >
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-white font-semibold">
        Test Case {index + 1}
      </h3>

      <button
        onClick={() => {
          const updated = testCases.filter(
            (_, i) => i !== index
          );

          setTestCases(updated);
        }}
        className="bg-red-600 px-2 py-1 rounded text-white text-sm"
      >
        Delete
      </button>
    </div>

    <textarea
      value={test.input}
      onChange={(e) => {
        const updated = [...testCases];
        updated[index].input = e.target.value;
        setTestCases(updated);
      }}
      className="w-full h-20 mt-2 p-2 bg-black text-white rounded"
      placeholder="Input"
    />

    <textarea
      value={test.expectedOutput}
      onChange={(e) => {
        const updated = [...testCases];
        updated[index].expectedOutput =
          e.target.value;
        setTestCases(updated);
      }}
      className="w-full h-20 mt-2 p-2 bg-black text-white rounded"
      placeholder="Expected Output"
    />
  </div>
))}           
        </div>

        {/* Output */}
        <div className="bg-black text-green-400 p-3 overflow-auto">

          <h3 className="text-white mb-2 font-semibold">
            Output
          </h3>
        {summary !== "Not Run" && (
          <div className="mb-3">
            <span
              className={`px-3 py-1 rounded text-white font-semibold ${
                passedCount === testCases.length
                  ? "bg-green-600"
                  : passedCount === 0
                  ? "bg-red-600"
                  : "bg-yellow-600"
              }`}
            >
              {summary}
            </span>
          </div>
        )}

          <pre>
            {output || "Output will appear here"}
          </pre>

          <div className="mt-2 text-yellow-400">
            Execution Time: {executionTime} ms
          </div>

          <div className="mt-3 border-t border-gray-700 pt-2">

            <h3 className="text-white mb-2 font-semibold">
              Test Result
            </h3>

            <pre
            className={`whitespace-pre-wrap ${
              testResult.includes("Accepted")
                ? "text-green-400"
                : testResult.includes("Wrong Answer")
                ? "text-red-400"
                : testResult.includes("Time Limit")
                ? "text-orange-400"
                : testResult.includes("Memory Limit")
                ? "text-purple-400"
                : testResult.includes("Compile Error")
                ? "text-yellow-400"
                : "text-white"
            }`}
          >
            {testResult}
          </pre>

          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;