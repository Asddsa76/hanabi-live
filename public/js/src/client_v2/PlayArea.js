const constants = require('../constants');
const HanabiCard = require('./HanabiCard');
const utils = require('./utils');

// Constants
const {
    CARD_H,
    CARD_W,
    PLAY_AREA_PADDING,
} = constants;

// Phaser devs warned against using too many levels of nested containers, so I didn't design
// containers for play stacks. This means we lose the ability to independently position them, but
// that's probably not something we will want to do.
class PlayArea extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene);
        this.x = config.x;
        this.y = config.y;
        this.suits = config.suits;
        this.scale = config.scale;
        this.horizSpacing = CARD_W * config.scale * PLAY_AREA_PADDING;

        this.zone = new Phaser.GameObjects.Zone(
            scene,
            config.x,
            config.y,
            this.horizSpacing * config.suits.length,
            CARD_H * config.scale,
        );
        this.zone.zoneContainer = this;
        this.zone.setRectangleDropZone(
            this.horizSpacing * config.suits.length,
            CARD_H * config.scale,
        );
        const cardsToAdd = this.suits.map(suit => new HanabiCard(scene, {
            suit,
            rank: 0,
            scale: config.scale,
        }));
        this.addCards(cardsToAdd);
    }

    addCards(cards) {
        // Cards are rendered in the order of the container, so cards at the end of the container
        // will be the front of the scene
        cards = utils.makeArray(cards);
        this.add(cards);
        cards.forEach(card => utils.transformToEnterContainer(card, this));
        this._addCardTweensToScene(cards);
    }

    _addCardTweensToScene(cards) {
        cards = utils.makeArray(cards);
        const nSuits = this.suits.length;

        for (const card of cards) {
            const suitIdx = this.suits.findIndex(suit => suit === card.suit);
            // eslint pls, this is way more readable than if I threw in a bunch of parens
            /* eslint-disable no-mixed-operators, space-infix-ops */
            const x = (suitIdx + 1/2 - nSuits/2) * this.horizSpacing;
            this.scene.tweens.add({
                targets: card,
                x,
                y: 0,
                duration: 1000,
            });
        }
    }
}

module.exports = PlayArea;
