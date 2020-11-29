import {Client} from "discord-rpc";
import {clientId, clientSecret} from "./config/discord-secrets";

export interface DiscordState {
    users: any[] | undefined;
    username: string;
    current_channel: string | undefined;
}

export default class DiscordRPC {
    eventReply: Function;
    discordState: DiscordState;
    rpc: Client;

    constructor(eventReply: Function) {
        this.discordState = {} as DiscordState;
        this.rpc = new Client({ transport: 'ipc' });
        this.eventReply = eventReply
    }

    getCurrentChannel() {
        this.rpc.request('GET_SELECTED_VOICE_CHANNEL', {}).then((r:any) => {
            if (r) {
                this.discordState.current_channel = r.name;
                this.discordState.users = r.voice_states;
            } else {
                this.discordState.current_channel = undefined;
            }
            this.eventReply('discordState', this.discordState);
        });
    }

    setupCurrentChannelListener() {
        setTimeout(this.getCurrentChannel, 3000);
    }
    connect() {
        this.rpc.on('ready', () => {
            console.log('Logged in as', this.rpc.application.name);
            console.log('Authed for user', this.rpc.user.username);
            this.discordState.username = this.rpc.user.username;
            this.eventReply('discordState', this.discordState);
            //this.setupCurrentChannelListener()
            this.getCurrentChannel();
            this.rpc.subscribe("VOICE_CHANNEL_SELECT", (channel: any) => {
                if (channel.channel_id != null) {
                    this.getCurrentChannel();
                }
            }).catch(console.error);

        });
        if (!this.discordState.username) {
            /*let accessToken = '';//this.store.get('discordToken');
            if (accessToken != '') {
                this.rpc.login({
                    clientId,
                    accessToken,
                    scopes: ["rpc"]
                }).catch(console.error);
            } else {
                this.rpc.login({
                    clientId,
                    scopes: ["rpc"],
                    clientSecret: '',
                    redirectUri: "http://localhost/",
                }).then(r => {
                    //this.store.set('discordToken', r.accessToken);
                }).catch(console.error)
            }*/
            this.rpc.connect(clientId).then((r:any) => {
                this.rpc.login({
                    clientId,
                    scopes: ["rpc"],
                    redirectUri: 'http://localhost/lol',
                    clientSecret
                }).catch(console.error)
            }).catch(console.error);

        } else {
            this.getCurrentChannel();
        }
    }

    setUserAudio(username: string, gain: number, left: number, right: number) {
        if (this.discordState.users) {
            for (let i = 0; i < this.discordState.users.length; i++) {
                let user = this.discordState.users[i];
                if (user.nick == username) {
                    this.rpc.setUserVoiceSettings(user.user.id, {
                        id: user.user.id,
                        volume: gain,
                        pan: {
                            left: Math.round(left * 10) / 10,
                            right: Math.round(right * 10) / 10
                        },
                        mute: false
                    }).catch(console.error);
                }
            }
        }
    }
}
