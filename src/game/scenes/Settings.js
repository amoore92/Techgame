import { Scene } from 'phaser';
import { crispText } from './ui';

export class Settings extends Scene
{
    constructor ()
    {
        super('Settings');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x222244);

        crispText(this,360, 200, 'Settings', {
            fontFamily: 'Roboto Black', fontSize: 60, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8, align: 'center'
        }).setOrigin(0.5);

        //  Mode toggle: 'scored' (timer + score, ends on the clock) <-> 'freeplay'
        //  (no timer, no score -- practise without pressure). The label updates
        //  in place each tap.
        const modeLabel = () =>
            `Mode: ${this.registry.get('mode') === 'freeplay' ? 'Freeplay' : 'Scored'}`;

        const toggleText = this.createMenuButton(360, 460, modeLabel(), () => {
            const next = this.registry.get('mode') === 'scored' ? 'freeplay' : 'scored';
            this.registry.set('mode', next);
            toggleText.setText(modeLabel());
        });

        //  Re-enter the player name. Returns here afterwards -- it does NOT start
        //  a game (unlike the PLAY path from the main menu).
        this.createMenuButton(360, 640, 'Set Name', () => {
            this.scene.start('Setname', { next: 'Settings' });
        });

        //  Back to the main menu.
        this.createMenuButton(360, 820, 'Back to Menu', () => {
            this.scene.start('MainMenu');
        });
    }

    //  Raised, clickable button -- matches the MainMenu / GameOver style.
    //  Returns the label text object so callers can update it (e.g. the toggle).
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

        return text;
    }
}
