import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Draggable from 'react-draggable';
import { useVideoCall } from '../context/VideoCallContext';
import { socket } from '../socket/socket';
import './VideoCall.css';

const VideoCall = forwardRef(({ roomId, username }, ref) => {
    const {
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
    } = useVideoCall();
    const { setIsVideoCallActive } = useVideoCall();
    const localVideoRef = useRef();
    const videoCallRef = useRef();

    // Expose the cleanup function to the parent component
    useImperativeHandle(ref, () => ({
        onCleanup: () => onCleanup(roomId),
    }));

    const endCall = async () => {
        await onCleanup(roomId).catch(err => console.error('Error ending call:', err));
        setIsAudioEnabled(false);
        setIsVideoEnabled(false);
        setIsVideoCallActive(false);
        window.location.reload()
    };

    useEffect(() => {
        // Check if media devices are supported
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
        } else {
            console.error('Media devices are not supported on this device.');
            alert('Media devices are not supported on this device.');
        }

        // Socket event listeners
        socket.on('userJoinedCall', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('iceCandidate', handleIceCandidate);
        socket.on('userLeftCall', handleUserLeft);

        // return () => {
        //     socket.off('userJoinedCall', handleUserJoined);
        //     socket.off('offer', handleOffer);
        //     socket.off('answer', handleAnswer);
        //     socket.off('iceCandidate', handleIceCandidate);
        //     socket.off('userLeftCall', handleUserLeft);
        // };
    }, [roomId, username]);

    const createPeerConnection = (userId) => {
        console.log('Creating peer connection for user:', userId);
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                // Add TURN servers for production
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate to user:', userId);
                socket.emit('iceCandidate', {
                    candidate: event.candidate,
                    to: userId,
                    roomId
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('Received remote stream from user:', userId);
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
        console.log('User joined call:', userId);
        const pc = createPeerConnection(userId);
        peerConnections.current[userId] = pc;

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('Sending offer to user:', userId);
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
        console.log('Received offer from user:', from);
        const pc = createPeerConnection(from);
        peerConnections.current[from] = pc;

        try {
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('Sending answer to user:', from);
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
        console.log('Received answer from user:', from);
        const pc = peerConnections.current[from];
        if (pc) {
            pc.setRemoteDescription(answer)
                .catch(err => console.error('Error setting remote description:', err));
        } else {
            console.error('Peer connection not found for user:', from);
        }
    };

    const handleIceCandidate = ({ candidate, from }) => {
        console.log('Received ICE candidate from user:', from);
        const pc = peerConnections.current[from];
        if (pc) {
            pc.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(err => {
                    console.error('Error adding ice candidate:', err);
                });
        } else {
            console.error('Peer connection not found for user:', from);
        }
    };

    const handleUserLeft = ({ userId }) => {
        console.log('User left call:', userId);
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
        <Draggable>
            <div 
                className="video-call-container" 
                ref={videoCallRef}
            >
                {/* Main video area (remote peer) */}
                <div className="video-grid">
                    {Object.entries(peers).map(([userId, stream]) => (
                        <div key={userId} className="video-item">
                            <video
                                autoPlay
                                src={stream}
                                className="video-element remote-video"
                                ref={(el) => {
                                    if (el) el.srcObject = stream;
                                }}
                            />
                            <div className="video-label">Peer</div>
                        </div>
                    ))}
                    
                    {/* If no peers, show placeholder */}
                    {Object.keys(peers).length === 0 && (
                        <div className="main-video placeholder">
                            <div className="waiting-message">Waiting for others to join...</div>
                        </div>
                    )}
                </div>

                <div className="controls">
                    <button onClick={toggleAudio}>
                        {isAudioEnabled ? '🎙️' : '🔇'}
                    </button>
                    <button onClick={toggleVideo}>
                        {isVideoEnabled ? '📹' : '🚫'}
                    </button>
                    <button 
                        onClick={endCall}
                        className="end-call-btn"
                    >
                        ❌
                    </button>
                    {/* Local video (picture-in-picture style) */}
                    {/* <div className="pip-video">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="video-element local-video"
                        />
                        <div className="video-label">You</div>
                    </div> */}
                </div>
            </div>
        </Draggable>
    );
});

export default VideoCall;