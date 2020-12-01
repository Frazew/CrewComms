import React, {useContext, useState} from 'react';
import {AmongUsContext, AmongUsGameContext} from "./App";
import {GameState, GlobalState} from "../main/AmongUsState";
import {ipcRenderer} from "electron";

function prettyPrintGlobalState(state: GlobalState) {
    switch (state) {
        case GlobalState.UNKNOWN:
            return 'UNKNOWN';
        case GlobalState.IN_LOBBY:
            return 'IN LOBBY';
        case GlobalState.IN_DISCUSSION:
            return 'VOTING';
        case GlobalState.IN_GAME:
            return 'PLAYING';
        case GlobalState.DISCONNECTED:
            return 'NOT CONNECTED';
        case GlobalState.NOT_CONFIGURED:
            return "NOT CONFIGURED";
        default:
            return "INVALID";
    }
}

export default function AmongUs() {
    const amongUsState: GlobalState = useContext(AmongUsContext);
    const amongUsGameState: GameState = useContext(AmongUsGameContext);

    const [configuring, setConfiguring] = useState(false);
    const [justConfigured, setJustConfigured] = useState(false);
    return (
        <div className={"container"}>
            <h2 className={"container-title"}>Among Us</h2>
            {
                amongUsState == GlobalState.NOT_CONFIGURED &&
                <button className="button" disabled={configuring} onClick={() => {
                    setConfiguring(true);
                    ipcRenderer.invoke('configureRegionInfo').then(() => {
                        setConfiguring(false);
                        setJustConfigured(true);
                    });
                }}>{ configuring ? 'Configuring...' : 'Configure Among Us' }</button>
            }
            {
                justConfigured && amongUsState == GlobalState.DISCONNECTED && <h3>All set! Please (re)start the game</h3>
            }
            <p>{ prettyPrintGlobalState(amongUsState) }</p>
            {
                amongUsGameState.code && <p>Connected to game <code>{amongUsGameState.code}</code></p>
            }
        </div>
    )
}
