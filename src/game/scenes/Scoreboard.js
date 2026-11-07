import { Scene } from 'phaser';
import { crispText } from './ui';
import { getLeaderboard } from '../api';

//  View-only leaderboard, reachable from the main menu. Reuses the same
//  getLeaderboard() the GameOver screen uses; fails soft to an empty list.
export class Scoreboard extends Scene
{
    constructor ()
    {
        super('Scoreboard');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x222244);

        crispText(this, 360, 140, '— Leaderboard —', {
            fontFamily: 'Roboto Black', fontSize: 48, color: '#FFD700',
            stroke: '#000000', strokeThickness: 8, align: 'center'
        }).setOrigin(0.5);

        this.statusText = crispText(this, 360, 260, 'Loading…', {
            fontFamily: 'Roboto Black', fontSize: 28, color: '#cccccc',
            stroke: '#000000', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5);

        this.loadScores();

        this.createMenuButton(360, 1120, 'Back', () => this.scene.start('MainMenu'));
    }

    async loadScores ()
    {
        const rows = await getLeaderboard();

        //  Player may have left already -> bail if the scene isn't active.
        if (!this.scene.isActive())
        {
            return;
        }

        this.statusText.destroy();

        if (!rows.length)
        {
            crispText(this, 360, 260, 'No scores yet — be the first!', {
                fontFamily: 'Roboto Black', fontSize: 28, color: '#cccccc',
                stroke: '#000000', strokeThickness: 4, align: 'center'
            }).setOrigin(0.5);
            return;
        }

        const myName = this.registry.get('playerName');
        rows.forEach((row, i) => {
            const cleanName = String(row.name).slice(0, 12);
            const line = `${i + 1}.  ${cleanName}  —  ${row.score}`;
            const isYou = row.name === myName;
            crispText(this, 360, 250 + i * 48, line, {
                fontFamily: 'Roboto Black',
                fontSize: 30,
                color: isYou ? '#FFD700' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);
        });
    }

    //  Raised, clickable button -- matches the MainMenu / GameOver style.
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

        const text = crispText(this, 0, 0, label, {
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
