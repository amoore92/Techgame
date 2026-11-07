import { Scene } from 'phaser';
import { crispText } from './ui';
import { adjustDeadline } from './timer';
import { createHud, wrongFlashText, queueCorrectFlash } from './hud';

//  Shared base for every step of building a drug to hand over: the drug pick AND
//  the three label steps all work the same way -- drag the one correct value chip
//  up onto the paper's whitespace. Correct -> +5s/+5pts and on to the next step;
//  wrong -> -5s, a red flash, and the chip snaps home. A wrong pick that drops the
//  clock to zero (or below) goes straight to GameOver.
//
//  Subclasses pass a config:
//    { optionsKey, progressKey, heading, context, next }
//  - optionsKey : key into round for a { correct, options } set
//  - progressKey: key in `progress` to record on success
//  - heading    : paper heading (string, or fn(round) -> string)
//  - context    : line above the paper (fn(round) -> string, or null)
//  - next       : scene key to advance to on success
export class BuildStepScene extends Scene
{
    constructor (key, config)
    {
        super(key);
        this.buildConfig = config;
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x222244);
        this.solved = false;   //  guard so only the first correct drop counts

        this.hud = createHud(this);

        const round = this.registry.get('round');

        //  Defensive: should never happen in normal flow, but don't hard-crash.
        if (!round)
        {
            this.scene.start('Game');
            return;
        }

        const { heading, optionsKey, context } = this.buildConfig;
        const optionSet = round[optionsKey];
        const headingText = typeof heading === 'function' ? heading(round) : heading;
        const contextText = context ? context(round) : null;

        //  Context line (e.g. the greeting on the drug step, or which drug we're
        //  labelling on the label steps).
        if (contextText)
        {
            crispText(this, 360, 180, contextText, {
                fontFamily: 'Roboto Black', fontSize: 26, color: '#FFD700',
                stroke: '#000000', strokeThickness: 5, align: 'center',
                wordWrap: { width: 650 }
            }).setOrigin(0.5);
        }

        //  The paper sheet (top half) the correct chip is dragged onto.
        this.paper = { left: 50, top: 225, right: 670, bottom: 560 };
        const g = this.add.graphics();
        g.fillStyle(0xfdf6e3, 1);
        g.fillRoundedRect(this.paper.left, this.paper.top, 620, 335, 18);
        g.lineStyle(4, 0xbfae8e, 1);
        g.strokeRoundedRect(this.paper.left, this.paper.top, 620, 335, 18);

        crispText(this, 360, 268, headingText, {
            fontFamily: 'Roboto Black', fontSize: 40, color: '#3a2f1a',
            align: 'center', wordWrap: { width: 560 }
        }).setOrigin(0.5);

        //  Where the placed value lands once dropped correctly.
        this.placed = crispText(this, 360, 415, '', {
            fontFamily: 'Roboto Black', fontSize: 30, color: '#000000',
            align: 'center', wordWrap: { width: 560 }
        }).setOrigin(0.5);

        //  Bottom half: 5 draggable, full-width value strips with larger text.
        const startY = 635;
        const gap = 138;
        optionSet.options.forEach((value, i) => {
            this.createStrip(360, startY + i * gap, value, optionSet.correct);
        });
    }

    //  A full-width draggable strip showing one option value (kept in '/' form).
    createStrip (homeX, homeY, value, correct)
    {
        const width = 660;
        const height = 124;

        const body = this.add.rectangle(0, 0, width, height, 0x9db4c0)
            .setStrokeStyle(4, 0xffffff);

        //  Start big for readability, then shrink only as far as needed so even
        //  the long warning strings still fit inside the strip. Short values
        //  (drug names, brief side effects) stay at the large size.
        const MAX_FONT = 30;
        const MIN_FONT = 16;
        const label = crispText(this, 0, 0, value, {
            fontFamily: 'Roboto Black', fontSize: MAX_FONT, color: '#10202b',
            align: 'center', wordWrap: { width: width - 30 }
        }).setOrigin(0.5);
        let fontSize = MAX_FONT;
        while (label.height > height - 18 && fontSize > MIN_FONT)
        {
            fontSize -= 2;
            label.setFontSize(fontSize);
        }

        const strip = this.add.container(homeX, homeY, [body, label]);
        strip.setSize(width, height);
        strip.setInteractive({ useHandCursor: true });
        this.input.setDraggable(strip);

        strip.on('drag', (pointer, dragX, dragY) => {
            if (this.solved) return;
            strip.setPosition(dragX, dragY);
        });

        strip.on('dragend', () => {
            if (this.solved) return;

            //  Dropped onto the paper?
            const onPaper = strip.x >= this.paper.left && strip.x <= this.paper.right
                && strip.y >= this.paper.top && strip.y <= this.paper.bottom;

            if (!onPaper)
            {
                this.snapBack(strip, homeX, homeY);
                return;
            }

            if (value === correct)
            {
                this.solve(strip, value);
            }
            else
            {
                this.gradeWrong(strip, homeX, homeY);
            }
        });
    }

    snapBack (strip, homeX, homeY)
    {
        this.tweens.add({
            targets: strip, x: homeX, y: homeY,
            duration: 200, ease: 'Back.easeOut'
        });
    }

    //  Wrong drop: lose 5s and flash. Repaint the clock immediately; if that drop
    //  emptied it, the tick takes us straight to GameOver and we stop here.
    gradeWrong (strip, homeX, homeY)
    {
        const scored = this.registry.get('mode') !== 'freeplay';
        if (scored)
        {
            adjustDeadline(this.registry, -5000);
            if (this.hud.refreshTimer() <= 0)
            {
                return;   //  refreshTimer already started GameOver
            }
        }
        this.hud.showFlash(wrongFlashText(scored));
        this.snapBack(strip, homeX, homeY);
    }

    //  Correct drop: record the part, reward time + points, show it on the paper,
    //  then advance to the next step.
    solve (strip, value)
    {
        this.solved = true;
        strip.disableInteractive();

        const { progressKey, next } = this.buildConfig;
        const progress = this.registry.get('progress');
        progress[progressKey] = value;
        this.registry.set('progress', progress);

        const scored = this.registry.get('mode') !== 'freeplay';
        if (scored)
        {
            this.registry.set('score', (this.registry.get('score') || 0) + 5);
            adjustDeadline(this.registry, 10000);
            this.hud.refreshTimer();   //  show the +10s right away
            queueCorrectFlash(this.registry);
        }

        //  Tuck the chosen value onto the paper, then move on.
        strip.setVisible(false);
        this.placed.setText(value);

        this.time.delayedCall(450, () => this.scene.start(next));
    }
}

//  Which drug we're labelling -- shown on the label steps (already picked).
const labelFor = (round) => `Label for: ${round.drug.brand} (${round.drug.generic})`;

export class LabelIndications extends BuildStepScene
{
    constructor ()
    {
        super('LabelIndications', {
            optionsKey: 'indicationOptions',
            progressKey: 'indications',
            heading: 'for',
            context: labelFor,
            next: 'LabelSideEffects',
        });
    }
}

export class LabelSideEffects extends BuildStepScene
{
    constructor ()
    {
        super('LabelSideEffects', {
            optionsKey: 'sideEffectOptions',
            progressKey: 'sideEffects',
            heading: 'Notable side effects',
            context: labelFor,
            next: 'LabelWarnings',
        });
    }
}

export class LabelWarnings extends BuildStepScene
{
    constructor ()
    {
        super('LabelWarnings', {
            optionsKey: 'warningOptions',
            progressKey: 'warnings',
            heading: 'Warnings and Counseling',
            context: labelFor,
            next: 'Game',
        });
    }
}
