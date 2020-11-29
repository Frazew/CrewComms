# CrewComms
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A proximity voice chat Discord implementation for the game Among Us.

## Features

* Proximity audio through Discord's user volume setting, based on real-time ingame coordinates
* Smart linking: matches a player's name with their Discord server nickname
* Full volume in lobbies and during discussions
* Dead players can:
    - Hear everyone during discussion time
    - Talk to other dead players during discussion time
    - Hear all other players dead or alive when close by while ingame
* Any sabotage cuts all forms of communication, except for dead players
* Players standing near the Communications room (on The Skeld and Pollus) hear random bits of voice from other players
* No client-server architecture: simply launch the GUI to get started
* Reliable: this intercepts the game's network packets instead of reading the memory
* **Cross-platform** hence too

## Setting up

[TODO]

## About

### Libraries

* [https://github.com/kognise/among-js]() the **amazing** library that makes it so easy to work with the Among Us network traffic
* [https://github.com/discordjs/RPC]() the original Discord RPC javascript library this project's implementation builds upon 

### See also

* [https://github.com/StarGate01/AmongUs-Mumble]() a similar project using Mumble
* [https://github.com/ottomated/CrewLink]() another project which uses its own voice architecture and reads the game state from memory
* [https://github.com/Impostor/Impostor]() an open-source server implementation
* [https://wiki.weewoo.net/wiki/Protocol]() a really thorough documentation of the Among Us network protocol

## License

MIT
