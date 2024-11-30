// src/components/VideoPlayer.js
import React, { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { useUser } from '../context/UserContext';
import './VideoPlayer.css';
import { socket } from "../socket/socket";
import { useVideoCall } from "../context/VideoCallContext";
import { FaBars, FaLink, FaSignOutAlt } from 'react-icons/fa'; // Import icons
import { api } from "../constants/api";

const VideoPlayer = () => {
  const playerRef = useRef(null);
  const drawerRef = useRef(null);
  const [playing, setPlaying] = useState('pause');
  const [url, setURL] = useState("");
  const [isTriggeringAllowed, setTriggeringAllowed] = useState(true);
  const { userData, clearUserData } = useUser();
  const { onCleanup, setIsVideoCallActive } = useVideoCall();
  const [playURL, setPlayURL] = useState(
    "https://www.youtube.com/watch?v=d9IKg-nizhQ"
  );
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for drawer

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [drawerRef]);

  useEffect(() => {
    socket.on("videoAction", (data) => {
      if (data.action === "play") {
        setPlaying('play');
      } else if (data.action === "pause") {
        setPlaying('pause');
      } else if (data.action === "seek") {
        playerRef.current.seekTo(data.time, "seconds");
        setTriggeringAllowed(false)
        setTimeout(() => {
          setTriggeringAllowed(true)
        }, 3000);
      }else if (data.action?.includes("setVideo")) {
        console.log(data?.action)
        const v=data?.action?.split('@')[1]
        console.log(v)
        setPlayURL(v)
      }
    });

    return () => socket.off("videoAction");
  }, []);

  const handlePlayPause = (action,time) => {
    if (!isTriggeringAllowed) return;
    !!time&&socket.emit("videoTriggered", { action: "seek", time,roomId:userData?.channel });
    socket.emit("videoTriggered", { action,roomId:userData?.channel });
    setPlaying(action);
  };

  const handleSeek = (time) => {
    socket.emit("videoTriggered", { action: "seek", time,roomId:userData?.channel });
  };

  const transcodeVideo = async (videoUrl) => {
    const response = await fetch(api+'/transcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl }),
    });
    const data = await response.json();
    return data.videoUrl;
  };

  const newVideo = async() => {
    let videoUrl = url;
    if (url.endsWith('.mkv')) {
      videoUrl = await transcodeVideo(url);
      videoUrl = api + videoUrl;
      setPlayURL(videoUrl);
    }
    setPlayURL(videoUrl);
    socket.emit("videoTriggered", { action:'setVideo@'+videoUrl,roomId:userData?.channel });
    setIsModalOpen(false)
  }

  const handleLogout = async() => {
    await onCleanup();
    setIsVideoCallActive(false)
    setTimeout(() => {
      socket.disconnect();
      clearUserData();
    }, 100);
  };

  return (
    <div className="video-page">
      <div className="video-header">
        <div className="brand">
          <img src="/logo192.png" alt="logo" className="brand-logo" />
          <span className="brand-name">WatchParty</span>
        </div>
        <div className="header-icons">
          <div className="icon" onClick={() => setIsModalOpen(!isModalOpen)}>
            <FaLink />
          </div>
          <div className="menu-icon" onClick={(e) => {if(e.defaultPrevented) return;setIsDrawerOpen(!isDrawerOpen)}}>
            <FaBars />
          </div>
        </div>
      </div>

      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`} style={{ zIndex: 1000 }} ref={drawerRef}>
        <div className="drawer-content">
          <div className="drawer-header">
            <img src="/logo192.png" alt="logo" className="brand-logo" />
            <span className="drawer-title">WatchParty</span>
          </div>
          <div className="drawer-body">
            <div className="user-info">
              <p>Username: {userData?.username}</p>
              <p>Channel: {userData?.channel}</p>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className={`modal ${isModalOpen ? 'open' : ''}`} style={{ zIndex: 1000 }}>
        <div className="modal-content">
          <div className="modal-header">
            <span className="modal-title">Set Video URL</span>
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
              <div className="video-buttons">
                <button 
                  className="set-video-btn"
                  onClick={() => newVideo()}
                >
                  Done
                </button>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="video-container">
        <ReactPlayer
          ref={playerRef}
          url={playURL}
          stopOnUnmount={true}
          onPlay={(e) => handlePlayPause("play",playerRef.current.getCurrentTime())}
          onPause={() => handlePlayPause("pause")}
          playing={playing==='play'}
          controls={true}
          onSeek={(e) => console.log("Seeked: ", e)}
          progressInterval={1000}
          width="100%"
          height="100%"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="react-player"
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
