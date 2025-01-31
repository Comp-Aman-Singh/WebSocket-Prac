import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
}

let allSocket: User[] = [];

interface Users {
  userId: string;
  readyStatus: boolean;
  currentPoint: number;
  startPoint: number;
  yourTurn: boolean;
}
interface Rooms {
  roomId: string;
  users: User[];
}
console.log("hi");

wss.on("connection", function (socket) {
  console.log("New client connected");
  socket.send("Hi there");

  socket.on("message", function (e) {
    try {
      console.log("Received:", e.toString());

      // Parse JSON safely
      let data = JSON.parse(e.toString());

      console.log("Parsed Data:", data);

      if (data.type === "join") {
        if (!data.payload?.roomId) {
          console.warn("Invalid join request: missing roomId");
          return;
        }

        console.log("User joined room:", data.payload.roomId);

        allSocket.push({
          // @ts-ignore
          socket,
          room: data.payload.roomId,
        });
      }
      if (data.type === "chat") {
        const currentUserRoom = allSocket.find(
          // @ts-ignore

          (user) => user.socket === socket
        )?.room;

        if (!currentUserRoom) {
          console.warn("User is not in any room, ignoring message.");
          return;
        }

        // Find all users in the same room
        const usersInRoom = allSocket.filter(
          (user) => user.room === currentUserRoom
        );

        if (usersInRoom.length === 0) {
          console.warn("No other users in the room.");
          return;
        }

        // Send message to all users except the sender
        usersInRoom.forEach((user) => {
          // @ts-ignore

          if (user.socket !== socket) {
            user.socket.send(data.payload?.message || "No message provided");
          }
        });
      }
    } catch (error) {
      // @ts-ignore

      console.error("Error processing message:", error.message);
    }
  });
});
