import React, {useContext, useState} from 'react';
import {ipcRenderer} from "electron";
import {DiscordContext} from "./App";

export default function Discord() {
    const discordState = useContext(DiscordContext);
    const [loggingIn, setLoggingIn] = useState(false);
    return (
        <div className={"container"}>
            <h2 className={"container-title"}>Discord</h2>
            {
                !discordState.username &&
                <button className="button" disabled={loggingIn} onClick={() => {
                    setLoggingIn(true);
                    ipcRenderer.send('discordLogin');
                }}>{ loggingIn ? 'Logging in...' : 'Connect to Discord' }</button>
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
