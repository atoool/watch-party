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
    "https://www.netflix.com/watch/81902035?trackId=15035895&tctx=1%2C0%2C6c58d0df-6726-46ab-80f5-629c12aab7ba-142169753%2CNES_D49BDDF0B4C6E225E91ECEEEC727DB-A3F87CB3ABAB23-286C862483_p_1732901177995%2CNES_D49BDDF0B4C6E225E91ECEEEC727DB_p_1732901177995%2C%2C%2C%2C%2CVideo%3A81902035%2CminiDpPlayButton"
  );
  const { userData, clearUserData } = useUser();
  const { onCleanup, setIsVideoCallActive } = useVideoCall();

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
    console.log(time);
    socket.emit("videoTriggered", { action: "seek", time,roomId:userData?.channel });
  };

  const newVideo = () => {
    socket.emit("videoTriggered", { action:'setVideo@'+url,roomId:userData?.channel });
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
        <div className="user-info">
          <span className="channel-name">Channel: {userData.channel}</span>
          <span className="username">User: {userData.username}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="video-container">
      {playURL.includes("netflix.com") ? (
        <iframe
          ref={playerRef}
          src={playURL}
          width="100%"
          height="100%"
          allowFullScreen
          className="react-player"
          title="Video Player"
          onLoad={() => {
            const iframe = playerRef.current;
            iframe.contentWindow.postMessage({ event: 'listening' }, '*');
            window.addEventListener('message', (event) => {
              if (event.origin !== new URL(playURL).origin) return;
              if (event.data.event === 'pause') {
                setPlaying(false);
                socket.emit("videoTriggered", { action: "pause", roomId: userData?.channel });
              }else if (event.data.event === 'play') {
                setPlaying(false);
                socket.emit("videoTriggered", { action: "play", roomId: userData?.channel });
              }  else if (event.data.event === 'seek') {
                const time = event.data.time;
                handleSeek(time);
              }
            });
          }}
        />
        ) : (
        <ReactPlayer
          ref={playerRef}
          url={playURL}
          playing={playing}
          controls={true}
          onSeek={(e) => handleSeek(e)}
          progressInterval={1000}
          width="100%"
          height="100%"
          className="react-player"
        />)}
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
        <div className="seek-buttons-container">
        <button 
          className="seek-backward-btn"
          style={{marginRight: '10px'}}
          onClick={()=>handleSeek(playerRef.current.getCurrentTime()-10)}
        >
          {"<< 10s"}
        </button>
        <button 
          className="play-pause-btn"
          onClick={handlePlayPause}
        >
          {playing ? "Pause" : "Play"}
        </button>

        <button 
          className="seek-forward-btn"
          style={{marginLeft: '10px'}}
          onClick={()=>handleSeek(playerRef.current.getCurrentTime()+10)}
        >
          {"10s >>"}
        </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
