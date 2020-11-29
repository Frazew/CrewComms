import {Client, Origin} from "kr-udp-proxy";
import {
    GameDataPayloadPacket,
    GameDataToPayloadPacket,
    GameDataType,
    PacketType,
    PayloadType,
    prettyDisconnectReason,
    prettyPayloadType,
    RPCFlag,
    RPCGameDataPacket
} from "@among-js/data";
import ByteBuffer from "bytebuffer";
import {parsePayloads} from "@among-js/packets";
import {PayloadPacket} from "@among-js/data/dist/types";
import {v2NumberToCode} from "@among-js/util";
import AmongUsState, {GlobalState} from "./AmongUsState";

export class AmongUsProxy implements Client {
    amongUsState: AmongUsState;

    public connected() {}
    public disconnected() {}

    public constructor(amongUsState: AmongUsState) {
        this.amongUsState = amongUsState
    }

    public message(origin: Origin, msg: Buffer) {
        const packetType: PacketType = msg[0];
        switch (packetType) {
            case PacketType.Disconnect: {
                console.warn(
                    `Disconnecting by request:\n${prettyDisconnectReason(msg[1])}`
                );
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
                    this.amongUsState.gameState.code = v2NumberToCode(payload.code);
                    this.amongUsState.globalState = GlobalState.IN_LOBBY;
                    console.log(payload);
                    break;
                case PayloadType.GameData:
                    this.processGameData(payload);
                    break;
                case PayloadType.GameDataTo:
                    this.processGameData(payload);
                    break;
                default:
                    console.log("Unknown payload type " + prettyPayloadType(payload.type));
                    console.log(payload);
                    console.log(this.amongUsState.gameState);
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
                        let isNew = component.readByte();
                        let playerId = component.readByte();
                        this.amongUsState.spawnPlayer(playerId, part.components[2].netId);
                    }
                    break;
                default:
                    console.log(part.type);
            }
        }
    }

    private processRPCData(part: RPCGameDataPacket) {
        switch (part.flag) {
            case RPCFlag.UpdateGameData:
                console.log(part.players);
                for (let player of part.players) {
                    this.amongUsState.updatePlayerSetGameData(player.playerId, player);
                }
                break;
        }
    }
}
