//  Shared top bar used by the build-the-label scenes (Inventory + the three
//  Label scenes) and reused by Game. Holds the score, the shared countdown, and
//  a one-line flash that explains why a pick did or didn't work
//  ("Wrong  -5 seconds" in red, "+5 seconds" in green).

import { crispText } from './ui';
import { startCountdown } from './timer';

const RED = '#FF6B6B';
export const GREEN = '#7CFC9B';

//  Build the top bar for a scene. In scored mode it shows the timer + score; in
//  freeplay it just shows a "Freeplay" tag (no clock, no points). Returns a small
//  controller with showFlash(text, color) for in-scene messages.
//
//  opts lets a scene place the HUD over its own art instead of the default dark
//  bar (e.g. Game fits the timer/score into the background's built-in black box):
//    { drawBar, depth, timer:{x,y,size}, score:{x,y,size}, flash:{x,y,size} }
export function createHud (scene, opts = {})
{
    const {
        drawBar = true,
        depth = 0,
        timer = { x: 360, y: 40, size: 30 },
        score = { x: 360, y: 82, size: 28 },
        flash: flashPos = { x: 360, y: 130, size: 26 },
    } = opts;

    const scored = scene.registry.get('mode') !== 'freeplay';

    //  Track everything we create so the caller's depth applies uniformly (keeps
    //  the HUD above a foreground image when one is present).
    const made = [];

    if (drawBar)
    {
        //  Dark bar across the top (the default look for the build-step scenes).
        made.push(scene.add.rectangle(360, 60, 320, 90, 0x333333));
    }

    //  No-op in freeplay (no clock); replaced below in scored mode.
    let refreshTimer = () => Infinity;

    if (scored)
    {
        //  Countdown, golden-yellow. Keep the tick so callers can repaint the
        //  clock the instant time changes.
        const countdown = startCountdown(scene, timer.x, timer.y, timer.size);
        refreshTimer = countdown.tick;
        made.push(countdown.text);

        const s = scene.registry.get('score') || 0;
        made.push(crispText(scene, score.x, score.y, `Score: ${s}`, {
            fontFamily: 'Roboto Black', fontSize: score.size, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5));
    }
    else
    {
        const fx = drawBar ? 360 : timer.x;
        const fy = drawBar ? 60 : (timer.y + score.y) / 2;
        made.push(crispText(scene, fx, fy, 'Freeplay', {
            fontFamily: 'Roboto Black', fontSize: 28, color: '#cccccc',
            stroke: '#000000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5));
    }

    //  Flash line. Starts empty.
    const flash = crispText(scene, flashPos.x, flashPos.y, '', {
        fontFamily: 'Roboto Black', fontSize: flashPos.size, color: RED,
        stroke: '#000000', strokeThickness: 5, align: 'center'
    }).setOrigin(0.5);
    made.push(flash);

    if (depth) made.forEach(obj => obj.setDepth(depth));

    const showFlash = (text, color = RED) => {
        flash.setText(text).setColor(color).setAlpha(1);
        scene.tweens.killTweensOf(flash);
        scene.tweens.add({
            targets: flash,
            alpha: 0,
            delay: 700,
            duration: 600,
            onComplete: () => flash.setText('')
        });
    };

    //  Consume any pending one-shot flash left by the previous scene (e.g. the
    //  green "+5 seconds" after a correct pick advanced us here).
    const pending = scene.registry.get('flash');
    if (pending)
    {
        scene.registry.set('flash', null);
        showFlash(pending.text, pending.color);
    }

    return { showFlash, refreshTimer };
}

//  Helpers so callers don't re-type the wording / colours.
export function wrongFlashText (scored)
{
    return scored ? 'Wrong  -5 seconds' : 'Wrong - try again';
}

//  Queue the green "+10 seconds" message for the next scene's HUD to show on load.
export function queueCorrectFlash (registry)
{
    registry.set('flash', { text: '+10 seconds', color: GREEN });
}
