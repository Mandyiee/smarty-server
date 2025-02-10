import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import cors from 'cors';
import http from 'http';

const PORT = 8080;
const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'HEAD'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const wss = new WebSocketServer({ server });
let webClients = new Set();

// Generate a unique ID for each connection
const generateId = () => Math.random().toString(36).substring(2, 15);

wss.on("connection", (socket) => {
    // Assign a unique ID to this connection
    socket.id = generateId();
    console.log(`Client connected with ID: ${socket.id}`);
    webClients.add(socket);
    
    socket.send(JSON.stringify({ status: "connected", id: socket.id }));
    
    socket.on("message", (data) => {
        try {
            //console.log(data);
            const parsedData = JSON.parse(data);
            // Add the sender's ID to the message
            parsedData.senderId = socket.id;
            
            console.log(`Message from ${socket.id}:`, parsedData);
            
            // Only send to other clients
            webClients.forEach(client => {
                if (client.id !== socket.id && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(parsedData));
                }
            });
        } catch (error) {
            console.error("Error parsing message:", error);
        }
    });
    
    socket.on("close", () => {
        console.log(`Client disconnected: ${socket.id}`);
        webClients.delete(socket);
    });
    
    socket.on("error", (error) => {
        console.error(`WebSocket error for client ${socket.id}:`, error);
        webClients.delete(socket);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});