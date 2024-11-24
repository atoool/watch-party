// src/components/VideoPlayer.js
import React, { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

const VideoPlayer = () => {
    const playerRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [url,setURL] = useState("")
    const [playURL,setPlayURL] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ")

    useEffect(() => {
        socket.on("video-action", (data) => {
            if (data.action === "play") {
                setPlaying(true);
            } else if (data.action === "pause") {
                setPlaying(false);
            } else if (data.action === "seek") {
                playerRef.current.seekTo(data.time, "seconds");
            }
        });

        return () => socket.off("video-action");
    }, []);

    const handlePlayPause = () => {
        const action = playing ? "pause" : "play";
        setPlaying(!playing);
        socket.emit("video-action", { action });
    };

    const handleSeek = (time) => {
        socket.emit("video-action", { action: "seek", time });
    };

    return (
        <div>
            <ReactPlayer
                ref={playerRef}
                url={playURL}
                playing={playing}
                controls
                onSeek={(e) => handleSeek(e)}
                style={{width:'100%',height:'100%'}}
            />
            <button onClick={handlePlayPause}>
                {playing ? "Pause" : "Play"}
            </button>

            <input
                type="text"
                value={url}
                onChange={(e) => setURL(e.target.value)}
            />
            <button onClick={()=>setPlayURL(url)}>Set video</button>
        </div>
    );
};

export default VideoPlayer;
