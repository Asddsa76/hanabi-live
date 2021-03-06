/*
    WebSocket command handlers for in-game events
*/

// Imports
const constants = require('../constants');
const drawCards = require('./ui/drawCards');
const globals = require('../globals');
const phaser = require('../client_v2/phaser');
const websocket = require('./ui/websocket');

exports.init = () => {
    let commandsToUse;
    if (window.location.pathname === '/dev2') {
        commandsToUse = commands; // The new client, defined below
    } else {
        commandsToUse = websocket; // The old client, defined in the "ui/websocket.js" file
    }

    for (const command of Object.keys(commandsToUse)) {
        globals.conn.on(command, (data) => {
            if (globals.currentScreen !== 'game') {
                return;
            }

            commandsToUse[command](data);
        });
    }
};

/*
    Code for the new development client
*/

// Define a command handler map
const commands = {};

commands.init = (data) => {
    // Record all of the settings for this game
    globals.init = data;

    // The variant is an integer on the server side, but an object on the client side,
    // so convert it accordingly
    globals.init.variant = constants.VARIANTS[data.variant];

    // Also initalize the "ui" object, which contains various graphical objects
    globals.ui = {
        cards: [],
    };

    // Build images for every card
    // (with respect to the variant that we are playing
    // and whether or not we have the colorblind feature enabled)
    globals.ui.cardImages = drawCards.drawAll(
        globals.init.variant,
        globals.settings.showColorblindUI,
        'normal',
    );

    // Draw the user interface
    phaser.init();

    // Keyboard hotkeys can only be initialized once the clue buttons are drawn
    // TODO
    // keyboard.init();

    // Tell the server that we are finished loading
    // TODO
    // globals.lobby.conn.send('ready');
};
