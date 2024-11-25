import React, { createContext, useContext, useState } from 'react';

const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
    const [isVideoCallActive, setIsVideoCallActive] = useState(false);

    const value = {
        isVideoCallActive,
        setIsVideoCallActive,
    };

    return (
        <VideoCallContext.Provider value={value}>
            {children}
        </VideoCallContext.Provider>
    );
};

export const useVideoCall = () => {
    const context = useContext(VideoCallContext);
    if (!context) {
        throw new Error('useVideoCall must be used within a VideoCallProvider');
    }
    return context;
}; 