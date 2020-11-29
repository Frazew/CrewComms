import React, {useContext} from 'react';
import {AmongUsContext, AmongUsGameContext} from "./App";
import {GameState, GlobalState} from "../main/AmongUsState";

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
        default:
            return 'NOT CONNECTED';
    }
}

export default function AmongUs() {
    const amongUsState: GlobalState = useContext(AmongUsContext);
    const amongUsGameState: GameState = useContext(AmongUsGameContext);
    return (
        <div className={"container"}>
            <h2 className={"container-title"}>Among Us</h2>
            <p>{ prettyPrintGlobalState(amongUsState) }</p>
            {
                amongUsGameState.code && <p>Connected to game <code>{amongUsGameState.code}</code></p>
            }
        </div>
    )
}
