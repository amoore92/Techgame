import { Scene } from 'phaser';
import { crispText } from './ui';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        //  Full-screen background; the title card is baked into the art at the
        //  top (asset 150,150,1140,820 -> world 75,75,570,410), so buttons sit
        //  below that band.
        this.add.image(360, 640, 'MainBg').setDisplaySize(720, 1280);

        crispText(this,360, 1210, 'Version 1.0.0', {
            fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        this.createMenuButton(360, 600, 'PLAY', () => {
            //  First play this session has no name yet -> collect one, then the
            //  Setname scene routes on to Game. Otherwise jump straight in.
            if (this.registry.get('playerName'))
            {
                this.scene.start('Game');
            }
            else
            {
                this.scene.start('Setname', { next: 'Game' });
            }
        });

        this.createMenuButton(360, 760, 'SCOREBOARD', () => {
            this.scene.start('Scoreboard');
        });

        this.createMenuButton(360, 920, 'SETTINGS', () => {
            this.scene.start('Settings');
        });
    }

    createMenuButton (x, y, label, onClick)
    {
        const width = 360;
        const height = 100;
        const depth = 12;

        const shadow = this.add.rectangle(depth, depth, width, height, 0x5c6b73)
            .setOrigin(0.5);

        const face = this.add.rectangle(0, 0, width, height, 0x9db4c0)
            .setOrigin(0.5);

        face.setStrokeStyle(6, 0xffffff);

        const text = crispText(this,0, 0, label, {
            fontFamily: 'Roboto Black',
            fontSize: 42,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        const button = this.add.container(x, y, [shadow, face, text]);

        button.setSize(width + depth, height + depth);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            face.setPosition(depth, depth);
            text.setPosition(depth, depth);
            shadow.setVisible(false);
        });

        button.on('pointerup', () => {
            face.setPosition(0, 0);
            text.setPosition(0, 0);
            shadow.setVisible(true);

            onClick();
        });

        button.on('pointerout', () => {
            face.setPosition(0, 0);
            text.setPosition(0, 0);
            shadow.setVisible(true);
        });
    }
}