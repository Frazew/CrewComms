import ReactDOM from 'react-dom';
import React, {useState} from 'react';
import AmongUs from "./AmongUs";
import Discord from "./Discord";
import {DiscordState} from "../main/DiscordRPC";
import {ipcRenderer} from "electron";
import {GameState, GlobalState} from "../main/AmongUsState";

export const DiscordContext = React.createContext<DiscordState>({} as DiscordState);
export const AmongUsContext = React.createContext<GlobalState>({} as GlobalState);
export const AmongUsGameContext = React.createContext<GameState>({} as GameState);

function App() {
    const [discordState, setDiscordState] = useState<DiscordState>({} as DiscordState);
    const [amongUsState, setAmongUsState] = useState<GlobalState>({} as GlobalState);
    const [amongUsGameState, setAmongUsGameState] = useState<GameState>({} as GameState);

    ipcRenderer.on('discordState', (event, state) => setDiscordState(state));
    ipcRenderer.on('amongUsState', (event, state) => setAmongUsState(state));
    ipcRenderer.on('amongUsGameState', (event, state) => setAmongUsGameState(state));

    return (
        <div id="main">
            <h1>CrewComms</h1>
            <DiscordContext.Provider value={discordState}>
                <Discord />
            </DiscordContext.Provider>
            <AmongUsContext.Provider value={amongUsState}>
                <AmongUsGameContext.Provider value={amongUsGameState}>
                    <AmongUs />
                </AmongUsGameContext.Provider>
            </AmongUsContext.Provider>
        </div>
    )
}
ReactDOM.render(<App />, document.getElementById('app'));
