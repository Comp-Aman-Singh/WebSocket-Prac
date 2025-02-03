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
  userRole: string;
  socket: WebSocket;
}
interface Rooms {
  roomId: string;
  users: Users[];
}
let allRooms: Rooms[] = [];
wss.on("connection", function (socket) {
  socket.send("Hi there");

  socket.on("message", function (e) {
    try {
      // Parse JSON safely
      let data = JSON.parse(e.toString());

      // Create a room Function
      if (data.type === "createRoom") {
        const roomId = Math.random().toString(6).substr(2, 6);
        allRooms.push({
          roomId: roomId,
          users: [
            {
              userId: data.userId,
              readyStatus: false,
              currentPoint: 0,
              startPoint: 0,
              yourTurn: false,
              userRole: "host",
              socket: socket as unknown as WebSocket,
            },
          ],
        });

        socket.send(JSON.stringify({ roomId: roomId }));
      }

      // Join a room function
      if (data.type === "join") {
        // Find the room
        let selectedRoom = allRooms.find((room) => room.roomId === data.roomId);
        if (!selectedRoom) {
          socket.send("Room not found");
          return;
        }

        // Check if room is full
        if (selectedRoom && selectedRoom.users.length >= 4) {
          socket.send("Room is full");
          return;
        }

        // Check if user is already in the room
        const findUser = selectedRoom?.users.find(
          (user) => user.userId === data.userId
        );
        if (findUser) {
          socket.send("User already in the room");
          return;
        }

        // Add user to the room
        if (selectedRoom) {
          selectedRoom.users.push({
            userId: data.userId,
            readyStatus: false,
            currentPoint: 0,
            startPoint: 0,
            yourTurn: false,
            userRole: "player",
            socket: socket as unknown as WebSocket,
          });
        } else {
          allRooms.push({
            roomId: data.roomId,
            users: [
              {
                userId: data.userId,
                readyStatus: false,
                currentPoint: 0,
                startPoint: 0,

                yourTurn: false,
                userRole: "player",
                socket: socket as unknown as WebSocket,
              },
            ],
          });
        }

        // Notify all users in the room
        selectedRoom = allRooms.find((room) => room.roomId === data.roomId);
        selectedRoom?.users.forEach((user) => {
          user.socket.send(
            JSON.stringify({ message: "Player joined the room" })
          );
        });
      }

      // Start Game function
      // user will send the roomId and the userId
      if (data.type === "startGame") {
        // Find the room
        let selectedRoom = allRooms.find((room) => room.roomId === data.roomId);
        if (!selectedRoom) {
          socket.send("Room not found");
          return;
        }
        // Find user in the room

        let user = selectedRoom.users.find(
          (user) => user.userId === data.userId
        );
        if (!user) {
          socket.send("Join a private room to start the game");
          return;
        }
        // Check if user is the host
        if (user.userRole !== "host") {
          user.readyStatus = !user.readyStatus;
          if (user.readyStatus === true) {
            socket.send(`${user.userId} is ready`);
          } else {
            socket.send(`${user.userId} is not ready`);
          }
        } else {
          const userNotReady = selectedRoom.users.find(
            (user) => user.readyStatus === false
          );
          if (userNotReady) {
            socket.send("All players must be ready to start the game");
            return;
          } else {
            selectedRoom.users.forEach((user) => {
              user.socket.send(JSON.stringify({ message: "Game started" }));
            });
          }
        }
      }

      if (data.type === "groupChat") {

        const selectedRoom = allRooms.filter(
          (item) => data.roomId === item.roomId
        );
        if (!selectedRoom || selectedRoom.length === 0) {
          socket.send("something went wrong");
          return;
        }

        // @ts-ignore
        const allMembers = selectedRoom[0].users;

        allMembers.forEach((item) =>
          item.socket.send(`${data.userId} : ${data.payload.message}`)
        );
        // return console.log(" selected Room 4 : ", selectedRoom[0].users);
      }
      // if (data.type === "chat") {
      //   const currentUserRoom = allSocket.find(
      //     // @ts-ignore

      //     (user) => user.socket === socket
      //   )?.room;

      //   if (!currentUserRoom) {
      //     console.warn("User is not in any room, ignoring message.");
      //     return;
      //   }

      //   // Find all users in the same room
      //   const usersInRoom = allSocket.filter(
      //     (user) => user.room === currentUserRoom
      //   );

      //   if (usersInRoom.length === 0) {
      //     console.warn("No other users in the room.");
      //     return;
      //   }

      //   // Send message to all users except the sender
      //   usersInRoom.forEach((user) => {
      //     // @ts-ignore

      //     if (user.socket !== socket) {
      //       user.socket.send(data.payload?.message || "No message provided");
      //     }
      //   });
      // }
    } catch (error) {
      // @ts-ignore

      console.error("Error processing message:", error.message);
    }
  });
});
