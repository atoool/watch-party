import { io } from "socket.io-client";
import { api } from "../constants/api";

export const socket = io(api, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Optional: Add connection listeners for debugging
socket.on('connect', () => {
    console.log('Socket connected!', socket.id);
    
    // Rejoin room on reconnection
    const savedRoom = localStorage.getItem('currentRoom');
    const savedUsername = localStorage.getItem('username');
    
    if (savedRoom && savedUsername) {
        socket.emit('joinRoom', { 
            roomId: savedRoom, 
            username: savedUsername 
        });
    }
});

socket.on('connect_error', (error) => {
    console.log('Socket connection error:', error);
});

// Add room-specific event listeners
socket.on('roomMessage', ({message}) => {
    console.log('Received message:', message);
});

socket.on('roomJoined', (data) => {
    console.log(`${data.username} joined room ${data.roomId}`);
}); 