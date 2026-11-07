import { Scene } from 'phaser';
import { makeRound, freshProgress } from '../roundLogic';
import { submitScore, getLeaderboard } from '../api';
import { crispText } from './ui';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x222244);

        //  Read the final score + name BEFORE resetting so we can show/submit them.
        const score = this.registry.get('score') || 0;
        const name = this.registry.get('playerName') || 'Player';
        const scored = this.registry.get('mode') !== 'freeplay';

        crispText(this,360, 140, 'Game Over', {
            fontFamily: 'Roboto Black',
            fontSize: 56,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        crispText(this,360, 250, scored ? `Final Score: ${score}` : 'Freeplay — not scored', {
            fontFamily: 'Roboto Black',
            fontSize: 44,
            color: scored ? '#7CFC9B' : '#cccccc',
            stroke: '#000000',
            strokeThickness: 7,
            align: 'center'
        }).setOrigin(0.5);

        crispText(this,360, 360, '— Leaderboard —', {
            fontFamily: 'Roboto Black',
            fontSize: 34,
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        //  Placeholder while the network call is in flight.
        this.statusText = crispText(this,360, 430, 'Loading…', {
            fontFamily: 'Roboto Black',
            fontSize: 26,
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        //  Submit this run's score (scored mode only -- freeplay isn't ranked),
        //  THEN load the leaderboard so the new score is already included.
        this.loadScores(scored, name, score);

        //  Play Again -> wipe the score/result and deal a fresh round, then play.
        this.createMenuButton(360, 950, 'Play Again?', () => {
            this.resetGame();
            this.scene.start('Game');
        });

        //  Quit -> reset too, so returning to the menu starts clean next time.
        this.createMenuButton(360, 1120, 'Quit', () => {
            this.resetGame();
            this.scene.start('MainMenu');
        });
    }

    //  Submit (if scored) then fetch + render the top scores. Async, but we
    //  don't block create() on it -- the screen shows "Loading…" until it lands.
    async loadScores (scored, name, score)
    {
        if (scored)
        {
            await submitScore(name, score);
        }

        const rows = await getLeaderboard();

        //  Scene may have been left already (player clicked a button) -- bail if so.
        if (!this.scene.isActive())
        {
            return;
        }

        this.statusText.destroy();

        if (!rows.length)
        {
            crispText(this,360, 430, 'No scores yet — be the first!', {
                fontFamily: 'Roboto Black', fontSize: 26, color: '#cccccc',
                stroke: '#000000', strokeThickness: 4, align: 'center'
            }).setOrigin(0.5);
            return;
        }

        rows.forEach((row, i) => {
            const cleanName = String(row.name).slice(0, 12);
            const line = `${i + 1}.  ${cleanName}  —  ${row.score}`;
            //  Gold-highlight rows belonging to this player.
            const isYou = row.name === name;
            crispText(this,360, 420 + i * 42, line, {
                fontFamily: 'Roboto Black',
                fontSize: 28,
                color: isYou ? '#FFD700' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }).setOrigin(0.5);
        });
    }

    //  Reset everything fresh: score to 0, cleared build progress, and a
    //  brand-new round dealt from the pools the Preloader stashed in the registry.
    resetGame ()
    {
        const pools = this.registry.get('pools');
        this.registry.set('score', 0);
        this.registry.set('progress', freshProgress());
        this.registry.set('flash', null);
        //  null so the countdown restarts cleanly on the next Game scene.
        this.registry.set('timerEnd', null);
        if (pools)
        {
            this.registry.set('round', makeRound(pools));
        }
    }

    //  Raised, clickable button -- matches the MainMenu style.
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
