import * as path from "path";
import {existsSync, readFileSync, writeFileSync} from "fs";
import {Address4 } from 'ip-address';
import ByteBuffer from "bytebuffer";

class ServerInfoData {
    name: string = "";
    ipv4: Address4 = new Address4('0.0.0.0');
    port: number = -1;

    constructor(args?: { name: string; ip: string; port: number; }) {
        if (args != null) {
            this.name = args.name;
            this.ipv4 = new Address4(args.ip);
            this.port = args.port;
        }
    }

    serialize(buffer: ByteBuffer) {
        buffer.writeUint8(this.name.length);
        buffer.writeString(this.name);

        let ipArray = this.ipv4.toArray();
        for (let i = 0; i < ipArray.length; i++) {
            buffer.writeUint8(ipArray[i]);
        }
        buffer.writeUint16(this.port);
        buffer.writeUint32(0);
    }

    deserialize(buffer: ByteBuffer): ServerInfoData {
        this.name = buffer.readString(buffer.readUint8());

        let ipBytes: number[] = [];
        for (let i = 0; i < 4; i++) {
            ipBytes.push(Number(buffer.readUint8()));
        }

        this.ipv4 = new Address4(ipBytes.join('.'));

        this.port = buffer.readUint16();
        buffer.readUint32();

        return this;
    }
}

class RegionInfoData {
    name: string = "";
    mainIp: string = "";
    servers: ServerInfoData[] = [];

    constructor(args?: {name: string, mainIp: string, servers: ServerInfoData[]}) {
        if (args != null) {
            this.name = args.name;
            this.mainIp = args.mainIp;
            this.servers = args.servers;
        }
    }

    serialize(buffer: ByteBuffer) {
        buffer.writeInt32(0);
        buffer.writeByte(this.name.length);
        buffer.writeString(this.name);
        buffer.writeByte(this.mainIp.length);
        buffer.writeString(this.mainIp);
        buffer.writeInt32(this.servers.length);

        for (let server of this.servers) {
            server.serialize(buffer);
        }
    }

    deserialize(buffer: ByteBuffer): RegionInfoData {
        buffer.readInt32();
        this.name = buffer.readString(buffer.readUint8());
        this.mainIp = buffer.readString(buffer.readUint8());
        let serverLength: number = buffer.readInt32();
        for (let i = 0; i < serverLength; i++) {
            let server = new ServerInfoData().deserialize(buffer);
            this.servers.push(server);
        }

        return this;
    }
}
/*
 * The whole logic behind this class is taken from the incredible Impostor open-source Among Us server project.
 * This is pretty much translated verbatim from the patcher this project provides.
 * See https://github.com/Impostor/Impostor/blob/dev/src/Impostor.Patcher/Impostor.Patcher.Shared/AmongUsModifier.cs
 */
export class RegionInfo {
    gameDir: string = "";
    regionFile: string = "";

    findDatFile() {
        const {APPDATA, USERPROFILE} = process.env;
        let found = false;

        if (APPDATA != null) {
            const LOCAL_LOW = path.join(APPDATA, "..", "LocalLow");
            if (existsSync(LOCAL_LOW)) {
                this.gameDir = path.join(LOCAL_LOW, "Innersloth", "Among Us");
                this.regionFile = path.join(this.gameDir, "regionInfo.dat");
                found = true;
            }
        } else if (USERPROFILE != null) {
            let steamAppsDir: string | null = null;
            if (process.platform == "linux") {
                steamAppsDir = path.join(USERPROFILE, ".steam", "steam", "steamapps");
            } else if (process.platform == "darwin") {
                steamAppsDir = path.join(USERPROFILE, "Library", "Application Support", "Steam", "steamapps");
            }

            if (steamAppsDir != null && existsSync(steamAppsDir)) {
                let libraries: string[] = [steamAppsDir];
                let libraryFoldersVdf: string = path.join(steamAppsDir, "libraryfolders.vdf");

                // @TODO Make this work
                if (existsSync(libraryFoldersVdf)) {
                    /*let libraryFolders: any = parse(readFileSync(libraryFoldersVdf).toString("ascii"));
                    for (let libraryFolderKey of libraryFoldersVdf) {

*                   }*/
                }
                for (let library of libraries) {
                    let LOCAL_LOW = path.join(library, "compatdata", "945360", "pfx", "drive_c", "users", "steamuser", "AppData", "LocalLow");
                    if (existsSync(LOCAL_LOW)) {
                        this.gameDir = path.join(LOCAL_LOW, "Innersloth", "Among Us");
                        this.regionFile = path.join(this.gameDir, "regionInfo.dat");
                        found = true;
                        break;
                    }
                }
            }
        }

        if (!found) {
            console.log("Couldn't locate regionInfo.dat");
        }
    }

    getIsCurrentServer(): boolean {
        this.findDatFile();

        if (this.regionFile != "" && existsSync(this.regionFile)) {
            let readBuffer: ByteBuffer= new ByteBuffer(undefined, true).append(readFileSync(this.regionFile));
            readBuffer.clear();
            const region: RegionInfoData = new RegionInfoData().deserialize(readBuffer);
            return region.name == "CrewComms";
        } else {
            console.log("Invalid regionInfo.dat path, could not set server to localhost");
            return false;
        }
    }

    setServerToLocalhost() {
        if (!this.getIsCurrentServer()) {
            let buffer: ByteBuffer = new ByteBuffer(undefined, true);
            let localServer = new ServerInfoData({name: "CrewComms-Master-1", ip: "127.0.0.1", port: 22023});
            let localRegion = new RegionInfoData({name: "CrewComms", mainIp: "127.0.0.1", servers: [localServer]});
            localRegion.serialize(buffer);
            buffer.clear();
            writeFileSync(this.regionFile, buffer.toBuffer());
        }
    }
}
