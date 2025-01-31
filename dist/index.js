"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let allSocket = [];
wss.on("connection", function (socket) {
    console.log("New client connected");
    socket.send("Hi there");
    socket.on("message", function (e) {
        var _a, _b;
        try {
            console.log("Received:", e.toString());
            // Parse JSON safely
            let data = JSON.parse(e.toString());
            console.log("Parsed Data:", data);
            if (data.type === "join") {
                if (!((_a = data.payload) === null || _a === void 0 ? void 0 : _a.roomId)) {
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
                const currentUserRoom = (_b = allSocket.find(
                // @ts-ignore
                (user) => user.socket === socket)) === null || _b === void 0 ? void 0 : _b.room;
                if (!currentUserRoom) {
                    console.warn("User is not in any room, ignoring message.");
                    return;
                }
                // Find all users in the same room
                const usersInRoom = allSocket.filter((user) => user.room === currentUserRoom);
                if (usersInRoom.length === 0) {
                    console.warn("No other users in the room.");
                    return;
                }
                // Send message to all users except the sender
                usersInRoom.forEach((user) => {
                    // @ts-ignore
                    var _a;
                    if (user.socket !== socket) {
                        user.socket.send(((_a = data.payload) === null || _a === void 0 ? void 0 : _a.message) || "No message provided");
                    }
                });
            }
        }
        catch (error) {
            // @ts-ignore
            console.error("Error processing message:", error.message);
        }
    });
});
