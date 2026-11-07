import { Scene } from 'phaser';
import { crispText } from './ui';
import { adjustDeadline } from './timer';
import { createHud } from './hud';
import { makeRound, freshProgress, isRoundComplete } from '../roundLogic';

const WORLD_W = 720;
const WORLD_H = 1280;
const SCORE_BOX = { x: 250, y: 110, w: 224.5, h: 80 };
const INV_BOX = { x: 87.5, y: 677.5, w: 262.5, h: 210 };
const DEPTH = { bg: 0, person: 5, fg: 10, hud: 30, bubble: 40 };

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {

        this.add.image(360, 640, 'GameBg').setDisplaySize(WORLD_W, WORLD_H).setDepth(DEPTH.bg);

        const round = this.registry.get('round');
        const progress = this.registry.get('progress') || freshProgress();
        const complete = round && isRoundComplete(progress);


        let bubbleBottom = 240;
        if (round)
        {
            bubbleBottom = this.createSpeechBubble(round.greetingText);
        }

        if (round && round.personKey)
        {
            this.createPerson(round.personKey, bubbleBottom);
        }

        this.add.image(360, 640, 'GameFg').setDisplaySize(WORLD_W, WORLD_H).setDepth(DEPTH.fg);

        this.hud = createHud(this, {
            drawBar: false,
            depth: DEPTH.hud,
            timer: { x: SCORE_BOX.x + SCORE_BOX.w / 2, y: 136, size: 26 },
            score: { x: SCORE_BOX.x + SCORE_BOX.w / 2, y: 170, size: 26 },
            flash: { x: 360, y: 224, size: 24 },
        });

        const backButton = this.add.circle(660, 60, 40, 0xaa3333).setDepth(DEPTH.hud);
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => this.scene.start('GameOver'));

        if (complete)
        {
            this.createPickupCard(round.drugCorrect);
        }
        else
        {
            this.createInventoryZone();
        }
    }

    createSpeechBubble (greeting)
    {
        const topY = 248;
        const wrapWidth = 520;

        const text = crispText(this, 0, 0, greeting, {
            fontFamily: 'Roboto Black', fontSize: 30, color: '#15202b',
            align: 'center', wordWrap: { width: wrapWidth }
        }).setOrigin(0.5);

        const padX = 40;
        const padY = 30;
        const bw = Math.min(WORLD_W - 40, Math.max(text.width + padX * 2, 300));
        const bh = text.height + padY * 2;
        const tail = 28;

        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 22);
        g.lineStyle(4, 0x15202b, 1);
        g.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 22);
        //  Little tail pointing down toward the customer.
        g.fillTriangle(-22, bh / 2 - 2, 22, bh / 2 - 2, 0, bh / 2 + tail);

        const centerY = topY + bh / 2;
        const bubble = this.add.container(360, centerY, [g, text]).setDepth(DEPTH.bubble);

        //  Pop in.
        bubble.setScale(0);
        this.tweens.add({ targets: bubble, scale: 1, duration: 280, ease: 'Back.easeOut' });

        return topY + bh + tail;
    }

    createPerson (personKey, bubbleBottom)
    {
        const size = 855;
        const topY = bubbleBottom - 250;
        this.add.image(360, topY, personKey)
            .setOrigin(0.5, 0)
            .setDisplaySize(size, size)
            .setDepth(DEPTH.person);
    }

    createInventoryZone ()
    {
        const zone = this.add.rectangle(
            INV_BOX.x + INV_BOX.w / 2, INV_BOX.y + INV_BOX.h / 2,
            INV_BOX.w, INV_BOX.h, 0xffffff, 0
        ).setDepth(DEPTH.hud);

        zone.setInteractive({ useHandCursor: true });
        //  Faint highlight so it's discoverable on hover/press.
        zone.on('pointerover', () => zone.setFillStyle(0xffffff, 0.12));
        zone.on('pointerout', () => zone.setFillStyle(0xffffff, 0));
        zone.on('pointerup', () => this.scene.start('Inventory'));
    }


    createPickupCard (label)
    {
        const BOX = { left: 50, top: 131, right: 669, bottom: 728 };

        const homeX = 360;
        const homeY = 1060;

        const card = this.add.image(0, 0, 'Drug Card');
        const targetHeight = 160;
        card.setScale(targetHeight / card.height);

        const text = crispText(this, 0, 0, label, {
            fontFamily: 'Roboto Black', fontSize: 30, color: '#000000',
            align: 'center', wordWrap: { width: card.displayWidth - 40 }
        }).setOrigin(0.5);

        const container = this.add.container(homeX, homeY, [card, text]).setDepth(DEPTH.bubble);
        container.setSize(card.displayWidth, card.displayHeight);
        container.setInteractive({ useHandCursor: true });
        this.input.setDraggable(container);

        container.on('drag', (pointer, dragX, dragY) => {
            container.setPosition(dragX, dragY);
        });

        container.on('dragend', () => {
            const inBox = container.x >= BOX.left && container.x <= BOX.right
                && container.y >= BOX.top && container.y <= BOX.bottom;

            if (inBox)
            {
                container.disableInteractive();   //  no second drop
                this.handIn();
            }
            else
            {
                this.tweens.add({
                    targets: container,
                    x: homeX, y: homeY,
                    duration: 200,
                    ease: 'Back.easeOut'
                });
            }
        });
    }

    handIn ()
    {
        if (this.registry.get('mode') !== 'freeplay')
        {
            this.registry.set('score', (this.registry.get('score') || 0) + 10);
            adjustDeadline(this.registry, 10000);
        }

        this.registry.set('round', makeRound(this.registry.get('pools')));
        this.registry.set('progress', freshProgress());

        this.scene.start('Game');
    }
}
