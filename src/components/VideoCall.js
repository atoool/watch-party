import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket/socket';
import './VideoCall.css';

const VideoCall = ({ roomId, username }) => {
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    
    const localVideoRef = useRef();
    const peerConnections = useRef({});

    useEffect(() => {
        // Get user media
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                setStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                
                // Join video room
                socket.emit('joinVideoRoom', { roomId, username });
            })
            .catch(err => console.error('Media error:', err));

        // Socket event listeners
        socket.on('userJoinedCall', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('iceCandidate', handleIceCandidate);
        socket.on('userLeftCall', handleUserLeft);

        return () => {
            socket.emit('leaveVideoRoom', { roomId });
            // Cleanup
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            if (peerConnections.current) {
                Object.values(peerConnections.current).forEach(pc => {
                    if (pc) pc.close();
                });
            }
            
            socket.off('userJoinedCall');
            socket.off('offer');
            socket.off('answer');
            socket.off('iceCandidate');
            socket.off('userLeftCall');
        };
    }, [roomId, username]);

    const createPeerConnection = (userId) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                // Add TURN servers for production
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('iceCandidate', {
                    candidate: event.candidate,
                    to: userId,
                    roomId
                });
            }
        };

        pc.ontrack = (event) => {
            setPeers(prev => ({
                ...prev,
                [userId]: event.streams[0]
            }));
        };

        if (stream && stream.getTracks()) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        return pc;
    };

    const handleUserJoined = async ({ userId }) => {
        const pc = createPeerConnection(userId);
        peerConnections.current[userId] = pc;

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', {
                offer,
                to: userId,
                roomId
            });
        } catch (err) {
            console.error('Error creating offer:', err);
        }
    };

    const handleOffer = async ({ offer, from }) => {
        const pc = createPeerConnection(from);
        peerConnections.current[from] = pc;

        try {
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', {
                answer,
                to: from,
                roomId
            });
        } catch (err) {
            console.error('Error handling offer:', err);
        }
    };

    const handleAnswer = ({ answer, from }) => {
        const pc = peerConnections.current[from];
        if (pc) {
            pc.setRemoteDescription(answer)
                .catch(err => console.error('Error setting remote description:', err));
        }
    };

    const handleIceCandidate = ({ candidate, from }) => {
        const pc = peerConnections.current[from];
        if (pc) {
            pc.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(err => {
                    console.error('Error adding ice candidate:', err);
                });
        }
    };

    const handleUserLeft = ({ userId }) => {
        if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
        }
        setPeers(prev => {
            const newPeers = { ...prev };
            delete newPeers[userId];
            return newPeers;
        });
    };

    const toggleAudio = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !isAudioEnabled;
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoEnabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    return (
        <div className="video-call-container">
            <div className="video-grid">
                <div className="video-item">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="video-element"
                    />
                    <div className="video-label">You</div>
                </div>
                {Object.entries(peers).map(([userId, stream]) => (
                    <div key={userId} className="video-item">
                        <video
                            autoPlay
                            playsInline
                            className="video-element"
                            ref={el => {
                                if (el) el.srcObject = stream;
                            }}
                        />
                        <div className="video-label">Peer</div>
                    </div>
                ))}
            </div>
            <div className="controls">
                <button onClick={toggleAudio}>
                    {isAudioEnabled ? '🎙️' : '🔇'}
                </button>
                <button onClick={toggleVideo}>
                    {isVideoEnabled ? '📹' : '🚫'}
                </button>
            </div>
        </div>
    );
};

export default VideoCall; 