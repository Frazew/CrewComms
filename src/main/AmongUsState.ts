import {GameData} from "@among-js/data";
import {EventEmitter} from "events";

export interface PlayerState {
    data?: GameData;
    pos_x: number;
    pos_y: number;
    netId: number;
    clientId: number;
    playerId: number;
}

export interface GameState {
    code: string;
    selfPlayerNetId: number;
    selfPlayerClientId: number;
    selfPlayerPlayerId: number;
    playerIdToPlayer: Map<number, PlayerState>;
    netIdToPlayer: Map<number, PlayerState>;
    clientIdToPlayer: Map<number, PlayerState>;
}

export enum GlobalState {
    IN_LOBBY, IN_GAME, IN_DISCUSSION, DISCONNECTED, UNKNOWN, NOT_CONFIGURED
}


export interface PlayerAudioSettings {
    playerName: string;
    volume: number;
    balance: number;
}

export default class AmongUsState extends EventEmitter {
    private globalState: GlobalState = GlobalState.UNKNOWN;
    private gameState: GameState = {} as GameState;
    private readonly eventReply: Function;

    constructor(eventReply: Function) {
        super();
        this.eventReply = eventReply;
        this.gameState.playerIdToPlayer = new Map<number, PlayerState>();
        this.gameState.netIdToPlayer = new Map<number, PlayerState>();
        this.gameState.clientIdToPlayer = new Map<number, PlayerState>();
    }

    getGameState() {
        return this.gameState;
    }

    onUpdateGlobalState() {
        this.eventReply('amongUsState', this.globalState);
    }

    onUpdateGameState() {
        this.eventReply('amongUsGameState', this.gameState);
    }

    updateGameCode(code: string) {
        this.gameState.code = code;
    }

    updateSelfPlayerClientId(clientId: number) {
        this.gameState.selfPlayerClientId = clientId;
    }

    updateGlobalState(state: GlobalState) {
        this.globalState = state;
        if (this.globalState == GlobalState.DISCONNECTED) {
            this.gameState.code = '';
        }
        this.onUpdateGlobalState();
    }

    removePlayerByNetId(netId: number) {
        if (this.gameState.netIdToPlayer.has(netId)) {
            let playerState = this.gameState.netIdToPlayer.get(netId);
            // @ts-ignore we checked before that it wasn't undefined
            this.gameState.clientIdToPlayer.delete(playerState.clientId);
            // @ts-ignore we checked before that it wasn't undefined
            this.gameState.playerIdToPlayer.delete(playerState.playerId);
            this.gameState.netIdToPlayer.delete(netId);
            this.onUpdateGameState();
        }
    }

    spawnPlayer(playerId: number, clientId: number, netId: number) {
        let playerState: PlayerState = {
            pos_x: 0,
            pos_y: 0,
            netId: netId,
            clientId: clientId,
            playerId: playerId
        };
        if (clientId == this.gameState.selfPlayerClientId) {
            this.gameState.selfPlayerNetId = netId;
            this.gameState.selfPlayerPlayerId = playerId;
        }
        this.gameState.playerIdToPlayer.set(playerId, playerState);
        this.gameState.netIdToPlayer.set(netId, playerState);
        this.gameState.clientIdToPlayer.set(clientId, playerState);
        this.onUpdateGameState();
    }

    updatePlayerSetGameData(playerId: number, gameData: GameData) {
        // @ts-ignore
        let playerState = this.gameState.playerIdToPlayer.get(playerId);
        if (playerState !== undefined) {
            playerState.data = gameData;
        } else {
            console.error("[updatePlayerSetGameData] Player " + playerId + "not found!")
        }
        this.onUpdateGameState();
    }

    updatePlayerSetPosition(netId: number, xPos: number, yPos: number) {
        let playerState = this.gameState.netIdToPlayer.get(netId);
        if (playerState !== undefined) {
            playerState.pos_y = yPos;
            playerState.pos_x = xPos;
            this.onPlayerUpdate(netId, playerState.playerId);
        } else {
            console.error("[updatePlayerSetPosition] Player " + netId + "not found!")
        }
        this.onUpdateGameState();
    }

    onPlayerUpdate(netId: number, playerId: number | undefined) {
        let volume = 0;
        let balance = 0.5;

        if (this.gameState.netIdToPlayer.get(this.gameState.selfPlayerNetId) == undefined) {
            console.error('[onPlayerUpdate] our own PlayerData object is undefined');
            return;
        }
        if (this.gameState.netIdToPlayer.get(netId) == undefined) {
            console.error('[onPlayerUpdate] the other player\'s PlayerData object is undefined');
            return;
        }
        // @ts-ignore we checked before that it wasn't undefined
        let me: PlayerState = this.gameState.netIdToPlayer.get(this.gameState.selfPlayerNetId);
        // @ts-ignore we checked before that it wasn't undefined
        let other: PlayerState = this.gameState.netIdToPlayer.get(netId);

        if ((other.data?.isDead && !me.data?.isDead) /*|| other.inVent*/) {
            volume = 0;
        } else if (this.globalState === GlobalState.IN_DISCUSSION) {
            volume = 100;
        } else if (this.globalState === GlobalState.IN_GAME || this.globalState === GlobalState.IN_LOBBY) {
            let vect_x = Math.abs(other.pos_x - me.pos_x);
            let vect_y = Math.abs(other.pos_y - me.pos_y);
            let r = Math.sqrt(Math.pow(vect_x, 2) + Math.pow(vect_y, 2));
            let theta = Math.atan(vect_y / vect_x);

            let decay_factor = Math.exp(-1.5);
            if (this.globalState === GlobalState.IN_LOBBY) {
                decay_factor = Math.exp(-4);
            }
            volume = Math.floor(80 * (Math.exp(-r) - decay_factor) / (1 - decay_factor));
            volume = Math.min(Math.max(0, volume), 80);


            balance = Math.cos(theta) * 0.5 + 0.5;
            balance = Math.round(balance * 10) / 10
        }
        this.emit('updatePlayerAudio', <PlayerAudioSettings>{
            playerName: other.data?.playerName,
            volume,
            balance
        })
    }
}
