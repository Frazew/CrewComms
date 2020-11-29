import {GameData} from "@among-js/data";

export interface PlayerState {
    data?: GameData;
    pos_x: number;
    pos_y: number;
    netId: number;
}

export interface GameState {
    code: string;
    playerIdToPlayer: Map<number, PlayerState>;
    netIdToPlayer: Map<number, PlayerState>;
}

export enum GlobalState {
    IN_LOBBY,IN_GAME,IN_DISCUSSION,UNKNOWN
}

export default class AmongUsState {
    globalState: GlobalState = GlobalState.UNKNOWN;
    gameState: GameState = {} as GameState;

    constructor() {
        this.gameState.playerIdToPlayer = new Map<number, PlayerState>();
        this.gameState.netIdToPlayer = new Map<number, PlayerState>();
    }

    spawnPlayer(playerId: number, netId: number) {
        let playerState: PlayerState = {
            pos_x: 0,
            pos_y: 0,
            netId: netId
        };
        this.gameState.playerIdToPlayer.set(playerId, playerState);
        this.gameState.netIdToPlayer.set(netId, playerState);
    }

    updatePlayerSetGameData(playerId: number, gameData: GameData) {
        // @ts-ignore
        let playerState = this.gameState.playerIdToPlayer.get(playerId);
        if (playerState !== undefined) {
            playerState.data = gameData;
        } else {
            console.error("[updatePlayerSetGameData] Player " + playerId + "not found!")
        }
    }

    updatePlayerSetPosition(netId: number, xPos: number, yPos: number) {
        let playerState = this.gameState.netIdToPlayer.get(netId);
        if (playerState !== undefined) {
            playerState.pos_y = yPos;
            playerState.pos_x = xPos;
        } else {
            console.error("[updatePlayerSetPosition] Player " + netId + "not found!")
        }
    }
}
