// src/components/VideoPlayer.js
import React, { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { useUser } from '../context/UserContext';
import './VideoPlayer.css';
import { socket } from "../socket/socket";
import { useVideoCall } from "../context/VideoCallContext";

const VideoPlayer = () => {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [url, setURL] = useState("");
  const [playURL, setPlayURL] = useState(
    "https://www.youtube.com/watch?v=d9IKg-nizhQ"
  );
  const { userData, clearUserData } = useUser();
  const { setIsVideoCallActive } = useVideoCall();

  useEffect(() => {
    socket.on("videoAction", (data) => {
      if (data.action === "play") {
        setPlaying(true);
      } else if (data.action === "pause") {
        setPlaying(false);
      } else if (data.action === "seek") {
        playerRef.current.seekTo(data.time, "seconds");
      }else if (data.action?.includes("setVideo")) {
        console.log(data?.action)
        const v=data?.action?.split('@')[1]
        console.log(v)
        setPlayURL(v)
      }
    });

    return () => socket.off("videoAction");
  }, []);

  const handlePlayPause = () => {
    const action = playing ? "pause" : "play";
    setPlaying(!playing);
    socket.emit("videoTriggered", { action,roomId:userData?.channel });
  };

  const handleSeek = (time) => {
    socket.emit("videoTriggered", { action: "seek", time,roomId:userData?.channel });
  };

  const newVideo = () => {
    socket.emit("videoTriggered", { action:'setVideo@'+url,roomId:userData?.channel });
  }

  const handleLogout = () => {
    setIsVideoCallActive(false)
    setTimeout(() => {
      socket.disconnect();
      clearUserData();
    }, 100);
  };

  return (
    <div className="video-page">
      <div className="video-header">
        <div className="user-info">
          <span className="channel-name">Channel: {userData.channel}</span>
          <span className="username">User: {userData.username}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="video-container">
        <ReactPlayer
          ref={playerRef}
          url={playURL}
          playing={playing}
          controls
          onSeek={(e) => handleSeek(e)}
          width="100%"
          height="100%"
          className="react-player"
        />
      </div>

      <div className="video-controls">
        <div className="url-input-container">
          <input
            type="text"
            value={url}
            onChange={(e) => setURL(e.target.value)}
            placeholder="Enter video URL..."
            className="url-input"
          />
          <button 
            className="set-video-btn"
            onClick={() => newVideo()}
          >
            Set Video
          </button>
        </div>
        <button 
          className="play-pause-btn"
          onClick={handlePlayPause}
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
