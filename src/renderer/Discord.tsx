import React, {useContext, useState} from 'react';
import {ipcRenderer} from "electron";
import {DiscordContext} from "./App";

export default function Discord() {
    const discordState = useContext(DiscordContext);
    const [loggingIn, setLoggingIn] = useState(false);
    const [discordError, setDiscordError] = useState('');
    ipcRenderer.on('discordLoginSuccess', (e, status, error) => {
        setLoggingIn(false);
        setDiscordError(error);
    })
    return (
        <div className={"container"}>
            <h2 className={"container-title"}>Discord</h2>
            {
                discordError != '' && <p>{discordError}</p>
            }
            {
                !discordState.username &&
                <button className="button" disabled={loggingIn} onClick={() => {
                    setLoggingIn(true);
                    ipcRenderer.send('discordLogin', discordError != '');
                }}>{ loggingIn ? 'Logging in...' : (discordError != '' ? 'Retry' : 'Connect to Discord') }</button>
            }
            {
                discordState.current_channel &&  <h3>Connected to channel { discordState.current_channel }</h3>
            }
            {
                discordState.users && discordState.users.map(user => {
                    return <p>{user.nick}</p>
                })
            }
        </div>
    )
}
