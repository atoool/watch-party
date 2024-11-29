import React, { createContext, useContext, useState, useRef } from 'react';
import { socket } from '../socket/socket';

const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
    const [isVideoCallActive, setIsVideoCallActive] = useState(false);
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const peerConnections = useRef({});

    // Cleanup function
    const onCleanup = async (roomId) => {
        // Stop all media tracks
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();  // Stop each track
            });
            setStream(null);  // Clear the stream from state
        }

        // Close all peer connections
        await Promise.all(
            Object.values(peerConnections.current).map(pc => {
                if (pc) {
                    return new Promise(resolve => {
                        pc.close();  // Close each peer connection
                        resolve();
                    });
                }
            })
        );
        peerConnections.current = {};  // Clear the peer connections

        // Notify server about leaving the video room
        socket.emit('leaveVideoRoom', { roomId });

        // Clear peers
        setPeers({});
    };

    return (
        <VideoCallContext.Provider value={{
            stream,
            setStream,
            peers,
            setPeers,
            isAudioEnabled,
            setIsAudioEnabled,
            isVideoEnabled,
            setIsVideoEnabled,
            peerConnections,
            onCleanup,
            isVideoCallActive,
            setIsVideoCallActive,
        }}>
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