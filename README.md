# Aptos Adapter Example
This repo serves as an example adapter between the Initia and Aptos blockchains. 
It provides a set of methods to facilitate network interactions.
The adapter is designed to be a reference implementation, demonstrating how to interact with the Initia.

## src/index.ts
This file contains the main execution script that demonstrates the usage of various methods provided by Initia client.
It includes examples of how to fetch blockchain data, interact with accounts, and submit transactions 
using the Initia network.
The script also highlights key functionalities such as generating raw transactions, 
simulating and signing them, and ultimately submitting them to the Initia blockchain.

## src/initia.ts
This file implements a set of utility methods that interact with the Initia network via Initia.js, 
designed to mirror the functionalities provided by the Aptos SDK. 
However, due to differences between the Initia and Aptos networks—such as variations in transaction structures, 
resource handling, and API interfaces—some methods remain unimplemented. 
These differences require further adaptation and may require alternative approaches to achieve similar outcomes 
across both networks.
