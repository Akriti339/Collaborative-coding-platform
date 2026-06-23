import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
function ProblemsPage() {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/problems")
      .then((res) => setProblems(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">
        Problem Set
      </h1>

      <table className="w-full border border-slate-700">
        <thead>
          <tr className="bg-slate-800">
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left">Difficulty</th>
          </tr>
        </thead>

        <tbody>
          {problems.map((problem) => (
            <tr
              key={problem._id}
              className="border-t border-slate-700"
            >
              <td className="p-3">
                    <Link
                        to={`/problem/${problem._id}`}
                        className="text-blue-400 hover:underline"
                    >
                        {problem.title}
                    </Link>
                    </td>

              <td className="p-3">
                {problem.difficulty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProblemsPage;