import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const createRoom = () => {
    const roomId = uuidv4().slice(0, 6);

    navigate(`/editor/${roomId}`);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-6">
        Collaborative Coding Platform
      </h1>

      <button
        onClick={createRoom}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
      >
        Create Room
      </button>
      <Link to="/problems">
        <button className="bg-green-500 text-white px-6 py-3 rounded mt-4">
          Problems
        </button>
      </Link>
    </div>
  );
}

export default Home;