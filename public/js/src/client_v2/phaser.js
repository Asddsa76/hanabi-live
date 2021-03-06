/*
    A Phaser demo
*/

// Imports
const constants = require('../constants');
const convert = require('../game/convert');
const globals = require('../globals');
const HanabiCard = require('./HanabiCard');
const Hand = require('./Hand');
const phaserGlobals = require('./phaserGlobals');
const PlayArea = require('./PlayArea');

const {
    HAND_BASE_SCALE,
    PLAY_AREA_BASE_SCALE,
} = constants;
// Variables
// let cursor;

exports.init = () => {
    const { width, height } = getGameSize();
    globals.phaser = new Phaser.Game({
        type: Phaser.AUTO, // "AUTO" picks "WEBGL" if available, otherwise "CANVAS"
        width,
        height,
        scene: {
            preload,
            create,
            update,
        },
    });
};

function preload() {
    const files = [
        'replay',
        'replay-disabled',
        'replay-back',
        'replay-back-disabled',
        'replay-back-full',
        'replay-back-full-disabled',
        'replay-forward',
        'replay-forward-disabled',
        'replay-forward-full',
        'replay-forward-full-disabled',
        'trashcan',
        'x',
    ];
    for (const file of files) {
        this.load.image(file, `/public/img/${file}.png`);
    }
    this.load.image('background', '/public/img/background.jpg');
    this.canvas = this.sys.game.canvas;
}

function create() {
    // Not sure if setting this is good
    this.cameras.roundPixels = true;
    // Set the background
    console.log(this.cameras);
    const background = this.add.sprite(
        this.canvas.width / 2,
        this.canvas.height / 2,
        'background',
    );
    // canvas width and height are expanded to browser window then shrunk minimally
    // to achieve 16:9 aspect ratio, via getGameSize
    background.setDisplaySize(this.sys.canvas.width, this.sys.canvas.height);
    setGlobalScale(this.sys.canvas.height);

    // Convert all of the card canvases to textures
    for (const key in globals.ui.cardImages) {
        if (Object.prototype.hasOwnProperty.call(globals.ui.cardImages, key)) {
            const canvas = globals.ui.cardImages[key];
            this.textures.addCanvas(key, canvas);
        }
    }

    // Had to modify these since Phaser objects have default origin at their centres
    const handLayoutsRelative = [
        { x: 0.5, y: 0.9, rot: 0 },
        { x: 0.1, y: 0.5, rot: -78 * (Math.PI / 180) },
        { x: 0.5, y: 0.1, rot: 0 },
        { x: 0.9, y: 0.5, rot: 78 * (Math.PI / 180) },
    ];
    const handLayoutsAbsolute = handLayoutsRelative.map(handLayout => ({
        x: handLayout.x * this.sys.canvas.width,
        y: handLayout.y * this.sys.canvas.height,
        rot: handLayout.rot,
        scale: HAND_BASE_SCALE * phaserGlobals.scale,
    }));
    phaserGlobals.hands = handLayoutsAbsolute.map(handLayout => new Hand(this, handLayout));
    const { hands } = phaserGlobals;
    hands.map(hand => this.add.existing(hand));

    let order = 0;
    for (const hand of hands) {
        for (let i = 0; i <= 7; i++) {
            let suitNum = i;
            const rank = i;
            if (suitNum === 6) {
                suitNum = 4;
            } else if (suitNum === 7) {
                suitNum = 3;
            }

            const suit = convert.msgSuitToSuit(suitNum, globals.init.variant);
            if (!globals.state.learnedCards[order]) {
                globals.state.learnedCards[order] = {
                    possibleSuits: globals.init.variant.suits.slice(),
                    possibleRanks: globals.init.variant.ranks.slice(),
                };
            }
            const card = new HanabiCard(this, {
                suit,
                rank,
                order,
                scale: hand.scale,
                suits: globals.init.variant.suits.slice(),
                ranks: globals.init.variant.ranks.slice(),
                holder: 0,
            });
            globals.ui.cards[order] = card;
            this.add.existing(card);
            card.setInteractive();
            this.input.setDraggable(card);
            hand.mutate(card, null);
            order += 1;
        }
    }
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });
    this.input.on('dragend', (pointer, gameObject, dropped) => {
        if (!dropped) {
            this.tweens.add({
                targets: gameObject,
                props: {
                    x: { value: gameObject.input.dragStartX, duration: 500 },
                    y: { value: gameObject.input.dragStartY, duration: 500 },
                },
            });
        }
    });
    this.input.on('drop', (pointer, gameObject, dropZone) => {
        gameObject.parentContainer.mutate(null, gameObject);
        gameObject.input.enabled = false;
        dropZone.zoneContainer.addCards(gameObject);
    });
    phaserGlobals.playArea = new PlayArea(this, {
        x: this.sys.canvas.width / 2,
        y: this.sys.canvas.height / 2,
        suits: globals.init.variant.suits.slice(),
        scale: PLAY_AREA_BASE_SCALE * phaserGlobals.scale,
    });
    this.add.existing(phaserGlobals.playArea);
    // cursors = this.input.keyboard.createCursorKeys();
    // Ultimately, this will be called at a higher level
}

// We want the game stage to always be 16:9
const getGameSize = () => {
    const ratio = 16 / 9;

    let ww = window.innerWidth;
    let wh = window.innerHeight;

    if (ww < 640) {
        ww = 640;
    }
    if (wh < 360) {
        wh = 360;
    }

    let cw;
    let ch;
    if (ww < wh * ratio) {
        cw = ww;
        ch = ww / ratio;
    } else {
        ch = wh;
        cw = wh * ratio;
    }

    cw = Math.floor(cw);
    ch = Math.floor(ch);

    if (cw > 0.98 * ww) {
        cw = ww;
    }
    if (ch > 0.98 * wh) {
        ch = wh;
    }

    return {
        width: cw,
        height: ch,
    };
};

function update() {
    // const hands = phaserGlobals.hands;
    // if (cursors.right.isDown) {
    // }
}

function setGlobalScale(height) {
    // 1920x1080 is the reference resolution of the global scale constants
    phaserGlobals.scale = height / 1080;
    console.log(phaserGlobals.scale);
}
