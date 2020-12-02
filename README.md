# CrewComms
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**This is currently a work in progress.**

A proximity voice chat Discord implementation for the game Among Us, cross-platform and reliable.

## About

This implementation sits between the game and the server with a simple UDP socket to relay the datagrams. There are no network capture or process memory reading shenanigans, which are both incredibly intrusive and not really cross-platform.


**Please bear in mind that setting this up for your group will require one of you to register a bot on Discord's website! (this is very quick though).**

## Features

- [x] Proximity audio through Discord's local user volume setting, based on real-time ingame coordinates
- [x] Smart linking: matches a player's name with their Discord server nickname
- [x] Full volume in lobbies and during discussions
- [x] Dead players can:
    - Hear everyone during discussion time
    - Talk to other dead players during discussion time
    - Hear all other players dead or alive when close by while ingame
- [ ] Any sabotage cuts all forms of communication, except for dead players
- [ ] Players standing near the Communications room (on The Skeld and Pollus) or in the Office room (on Mira HQ) hear random bits of voice from other players
- [x] No client-server architecture: simply launch the GUI to get started
- [x] Reliable: this intercepts the game's network packets instead of reading the process memory or running a full network capture
- [x] **Cross-platform** hence too

## Setting up

*TODO*

## Building

*TODO*

## Contributing

*TODO*

## About

### Libraries

* [https://github.com/kognise/among-js](https://github.com/kognise/among-js) the **amazing** library that makes it so easy to work with the Among Us network traffic
* [https://github.com/discordjs/RPC](https://github.com/discordjs/RPC) the original Discord RPC javascript library this project's implementation builds upon 

### See also

* [https://github.com/StarGate01/AmongUs-Mumble](https://github.com/StarGate01/AmongUs-Mumble) a similar project using Mumble
* [https://github.com/ottomated/CrewLink](https://github.com/ottomated/CrewLink) another project which uses its own voice architecture and reads the game state from memory
* [https://github.com/Impostor/Impostor](https://github.com/Impostor/Impostor) an open-source server implementation
* [https://github.com/codyphobe/among-us-protocol](https://github.com/codyphobe/among-us-protocol) an in-depth documentation of the Among Us network protocol and inner data structures
* [https://wiki.weewoo.net/wiki/Protocol](https://wiki.weewoo.net/wiki/Protocol) another source of documentation on the Among Us network protocol

## License

MIT
