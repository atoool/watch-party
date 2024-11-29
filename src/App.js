import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VideoPlayer from "./components/VideoPlayer";
import Chat from "./components/Chat";
import Home from "./components/Home";
import { UserProvider } from './context/UserContext';
import { VideoCallProvider } from './context/VideoCallContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const userData = JSON.parse(sessionStorage.getItem('watchPartyUser') || '{}');
    if (!userData.username || !userData.channel) {
        return <Navigate to="/" />;
    }
    return children;
};

const WatchPage = () => {
    return (
        <div style={{overflowY:'none'}}>
            <VideoPlayer />
            <Chat />
        </div>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <VideoCallProvider>
                <UserProvider>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route 
                            path="/watch" 
                            element={
                                <ProtectedRoute>
                                    <WatchPage />
                                </ProtectedRoute>
                            } 
                        />
                    </Routes>
                </UserProvider>
            </VideoCallProvider>
        </BrowserRouter>
    );
};

export default App;