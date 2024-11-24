import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './Home.css';
import { socket } from '../socket/socket';

const Home = () => {
    const [username, setUsername] = useState('');
    const [channel, setChannel] = useState('');
    const navigate = useNavigate();
    const { updateUserData, userData } = useUser();

    const joinRoom = (roomId, username) => {
        localStorage.setItem('currentRoom', roomId);
        localStorage.setItem('username', username);
        socket.emit('joinRoom', { roomId, username });
        socket.emit("sendMessageToRoom", { roomId, message: username+" joined the room!" });
    };

    useEffect(() => {
        // If user data exists, redirect to watch page
        if (userData.username && userData.channel) {
            joinRoom(userData?.channel,userData?.username)
            navigate('/watch');
        }
    }, [userData, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim() && channel.trim()) {
            const roomId = channel;
            updateUserData(username.trim(), channel.trim());
            navigate('/watch');
        }
    };

    return (
        <div className="home-container">
            <h1>Watch Party</h1>
            <form onSubmit={handleSubmit} className="join-form">
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Enter channel name"
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Join Watch Party</button>
            </form>
        </div>
    );
};

export default Home;
