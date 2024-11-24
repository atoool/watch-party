// src/App.js
import React from "react";
import VideoPlayer from "./components/VideoPlayer";
import Chat from "./components/Chat";

const App = () => {
    return (
        <div>
            <h1>Watch Party</h1>
            <VideoPlayer />
            <Chat />
        </div>
    );
};

export default App;
