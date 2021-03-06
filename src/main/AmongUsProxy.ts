import {Client, Origin} from "kr-udp-proxy";
import {
    GameDataPayloadPacket,
    GameDataToPayloadPacket,
    GameDataType, MurderPlayerRPCGameDataPacket,
    PacketType,
    PayloadPacket,
    PayloadType, prettyGameDataType, prettyPayloadType, prettyRPCFlag,
    RPCFlag,
    RPCGameDataPacket, VotingCompleteRPCGameDataPacket
} from "@among-js/data";
import ByteBuffer from "bytebuffer";
import {v2NumberToCode} from "@among-js/util";
import AmongUsState, {GlobalState} from "./AmongUsState";
import {parsePayloads} from "@among-js/packets";

export class AmongUsProxy implements Client {
    amongUsState: AmongUsState;

    public connected() {}
    public disconnected() {
        this.amongUsState.updateGlobalState(GlobalState.DISCONNECTED);
    }

    public constructor(amongUsState: AmongUsState) {
        this.amongUsState = amongUsState
    }

    public message(origin: Origin, msg: Buffer) {
        const packetType: PacketType = msg[0];
        switch (packetType) {
            case PacketType.Disconnect: {
                this.amongUsState.updateGlobalState(GlobalState.DISCONNECTED);
                break;
            }

            case PacketType.Normal: {
                this.handlePayloadPacket(msg, 1);
                break;
            }

            case PacketType.Reliable: {
                this.handlePayloadPacket(msg, 3);
                break;
            }

            default: {
                if (process.env.AJ_DEBUG === 'yes') {
                    console.warn(`Unknown packet type: ${packetType}`);
                }
            }
        }
    }

    private handlePayloadPacket(buffer: Buffer, offset: number) {
        const bb = new ByteBuffer(buffer.length - offset, true);
        bb.append(buffer.slice(offset));
        bb.clear();

        let payloads: PayloadPacket[] = parsePayloads(bb);
        for (let payload of payloads) {
            switch (payload.type) {
                case PayloadType.JoinedGame:
                    this.amongUsState.updateGameCode(v2NumberToCode(payload.code));
                    this.amongUsState.updateGlobalState(GlobalState.IN_LOBBY);
                    this.amongUsState.updateSelfPlayerClientId(payload.playerClientId);
                    break;
                case PayloadType.GameData:
                    this.processGameData(payload);
                    break;
                case PayloadType.GameDataTo:
                    this.processGameData(payload);
                    break;
                case PayloadType.StartGame:
                    this.amongUsState.updateGlobalState(GlobalState.IN_GAME);
                    break;
                case PayloadType.EndGame:
                    this.amongUsState.updateGlobalState(GlobalState.IN_LOBBY);
                    break;
                default:
                    console.log("Unknown payload type " + prettyPayloadType(payload.type));
            }
        }
    }

    private processGameData(payload: GameDataPayloadPacket | GameDataToPayloadPacket ) {
        for (let part of payload.parts) {
            switch (part.type) {
                case GameDataType.RPC:
                    this.processRPCData(part);
                    break;
                case GameDataType.Data:
                    //let x_pos = lerp(0, 1,part.position.x / 65535);
                    //let y_pos = lerp(0, 1,part.position.y / 65535);
                    this.amongUsState.updatePlayerSetPosition(part.netId, part.position.x, part.position.y);
                    break;
                case GameDataType.Spawn:
                    if (part.spawnId == 4) {
                        let component = part.components[0].data;
                        // Ignore isNew but we need to read the byte, we could also increment the offset but meh
                        // @ts-ignore
                        component.readByte();
                        let playerId = component.readByte();
                        this.amongUsState.spawnPlayer(playerId, part.ownerId, part.components[2].netId, part.components[1].netId, part.components[0].netId);
                    }
                    break;
                case GameDataType.Despawn:
                    this.amongUsState.removePlayerByNetId(part.netId);
                    break;
                default:
                    console.log("Unknown GameData type " + prettyGameDataType(part.type));
            }
        }
    }

    private processRPCData(part: RPCGameDataPacket) {
        switch (part.flag) {
            case RPCFlag.UpdateGameData:
                for (let player of part.players) {
                    this.amongUsState.updatePlayerSetGameData(player.playerId, player);
                }
                break;
            case RPCFlag.ReportDeadBody || RPCFlag.StartMeeting:
                this.amongUsState.updateGlobalState(GlobalState.IN_DISCUSSION);
                for (let player of this.amongUsState.getGameState().clientIdToPlayer.values()) {
                    this.amongUsState.onPlayerUpdate(player.netId, player.playerId);
                }
                break;
            case RPCFlag.VotingComplete:
                this.amongUsState.updateGlobalState(GlobalState.IN_GAME);
                if ((part as VotingCompleteRPCGameDataPacket).exiled != 255) {
                    this.amongUsState.updatePlayerSetDead(undefined, (part as VotingCompleteRPCGameDataPacket).exiled as number);
                }
                for (let player of this.amongUsState.getGameState().clientIdToPlayer.values()) {
                    this.amongUsState.onPlayerUpdate(player.netId, player.playerId);
                }
                break;
            case RPCFlag.EnterVent:
                this.amongUsState.updatePlayerSetInVent(part.netId, true);
                break;
            case RPCFlag.ExitVent:
                this.amongUsState.updatePlayerSetInVent(part.netId, false);
                break;
            case RPCFlag.MurderPlayer:
                this.amongUsState.updatePlayerSetDead((part as MurderPlayerRPCGameDataPacket).id, undefined);
                break;
            default:
                console.log("Unknown RPC type " + prettyRPCFlag(part.flag));
        }
    }
}
