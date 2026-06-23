import { io } from "socket.io-client";

const socket = io(
  "https://collaborative-coding-platform-fdct.onrender.com"
);

export default socket;