import ReactDOM from 'react-dom';
import React from 'react';
import {ipcRenderer} from "electron";

function App() {
    return (
        <div id="main">
            <h1>CrewComms</h1>
            <button className="button" onClick={() => {
                ipcRenderer.send('discordLogin');
            }}>Connect to Discord</button>
        </div>
    )
}
ReactDOM.render(<App />, document.getElementById('app'));
