import {Client} from "discord-rpc";
import {clientId, clientSecret} from "./config/discord-secrets";
import Store from "electron-store";
import {ConfigSchema} from "./index";

export interface DiscordState {
    users: any[] | undefined;
    username: string;
    current_channel: string;
}

export default class DiscordRPC {
    eventReply: Function;
    discordState: DiscordState;
    rpc: Client;
    configStore: Store<ConfigSchema>;
    currentChannelInterval: any;

    constructor(eventReply: Function, configStore: Store<ConfigSchema>) {
        this.discordState = {} as DiscordState;
        this.rpc = new Client({ transport: 'ipc' });
        this.eventReply = eventReply;
        this.configStore = configStore;
    }

    getCurrentChannel() {
        this.rpc.request('GET_SELECTED_VOICE_CHANNEL', {}).then((r:any) => {
            if (r) {
                this.discordState.current_channel = r.name;
                this.discordState.users = r.voice_states;
            } else {
                this.discordState.current_channel = '';
            }
            this.eventReply('discordState', this.discordState);
        });
        this.setupCurrentChannelListener();
    }

    setupCurrentChannelListener() {
        if (this.currentChannelInterval == undefined) {
            this.currentChannelInterval = setInterval(() => {this.getCurrentChannel();}, 3000);
        }
    }

    connect(reply: Function, force: boolean) {
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
            if (force) {
                this.configStore.set('discordToken', '');
            }
            let accessToken: string = this.configStore.get('discordToken');

            if (accessToken == '' || accessToken == undefined) {
                this.rpc.login({
                    clientId,
                    scopes: ["rpc"],
                    clientSecret,
                    redirectUri: "http://localhost/lol",
                }).then((r: any) => {
                    reply('discordLoginSuccess', true, undefined);
                    this.configStore.set('discordToken', r.accessToken);
                }).catch((e) => {
                    reply('discordLoginSuccess', false, e.toString());
                    console.error(e)
                })
            } else {
                this.rpc.login({
                    clientId,
                    accessToken,
                    scopes: ["rpc"]
                }).catch((e) => {
                    console.error(e);
                    reply('discordLoginSuccess', false, e.toString());
                });
            }
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
