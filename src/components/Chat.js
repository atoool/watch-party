// src/components/Chat.js
import React, { useState, useEffect, useRef } from "react";
import { useUser } from '../context/UserContext';
import './Chat.css';
import { socket } from "../socket/socket";
import VideoCall from './VideoCall';
import { useVideoCall } from '../context/VideoCallContext';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [userCount, setCount] = useState(0);
    const { userData } = useUser();
    const messagesEndRef = useRef(null);
    const { isVideoCallActive, setIsVideoCallActive } = useVideoCall();

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {

        // Listen for confirmation or messages from the server
        socket.on("roomJoined", ({message, count}) => {
            console.log("Received roomJoined:", message);
            setMessages((prev) => [...prev, { 
                text: message,
                user: "System",
                isSelf: false 
            }]);
            setCount(count);
        });

        socket.on("roomMessage", (msg) => {
            console.log("Received roomMessage:", msg);
            setMessages((prev) => [...prev, {
                text: msg.message,
                user: msg.username || "Unknown",
                isSelf:msg.username==userData.username
            }]);
        });

        return () =>{
            socket.off("roomMessage");
            socket.off("roomJoined");
        }
    }, []);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            socket.emit("sendMessageToRoom", {roomId:userData.channel,message,username:userData?.username});
            setMessages((prev) => [...prev, { text: message, user: userData.username, isSelf: true }]);
            setMessage("");
        }
    };

    return (
        <div className="chat-wrapper">

            <div className="chat-container">
                
                <div className="chat-header">
                    <button 
                        className="video-call-toggle"
                        onClick={() => setIsVideoCallActive(!isVideoCallActive)}
                    >
                        {isVideoCallActive ? '📞 End Call' : '📞 Start Call'}
                    </button>
                </div>
                
                <div className={`chat-messages ${isVideoCallActive ? 'with-video' : ''}`}>
                    {messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`message ${msg.isSelf ? 'self' : 'other'}`}
                        >
                            <span className="message-user">{msg.user}</span>
                            <div className="message-content">{msg.text}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {isVideoCallActive && (
                    <div className="video-call-wrapper">
                        <VideoCall 
                            roomId={userData.channel} 
                            username={userData.username}
                            socket={socket}
                            onEndCall={() => setIsVideoCallActive(false)}
                        />
                    </div>
                )}

                <form className="chat-input-form" onSubmit={sendMessage}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="chat-input"
                    />
                    <button type="submit" className="send-button">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
