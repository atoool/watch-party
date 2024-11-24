// src/components/Chat.js
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://watch-party-backend-sppv.onrender.com");

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        socket.on("chat-message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => socket.off("chat-message");
    }, []);

    const sendMessage = () => {
        socket.emit("chat-message", message);
        setMessages((prev) => [...prev, `You: ${message}`]);
        setMessage("");
    };

    return (
        <div>
            <div>
                {messages.map((msg, index) => (
                    <p key={index}>{msg}</p>
                ))}
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chat;
