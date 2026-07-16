"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastMessage = exports.initWebSocket = void 0;
const ws_1 = require("ws");
let wss = null;
const initWebSocket = (server) => {
    wss = new ws_1.WebSocketServer({ server });
    wss.on('connection', (ws) => {
        console.log('New WebSocket connection established');
        ws.on('close', () => {
            console.log('WebSocket connection closed');
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
    console.log('WebSocket Server initialized');
};
exports.initWebSocket = initWebSocket;
const broadcastMessage = (type, payload) => {
    if (!wss)
        return;
    const message = JSON.stringify({ type, data: payload, timestamp: new Date().toISOString() });
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    });
};
exports.broadcastMessage = broadcastMessage;
//# sourceMappingURL=websocket.js.map