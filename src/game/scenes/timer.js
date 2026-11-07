import { crispText } from './ui';

//  A single countdown that persists across the Game and Inventory scenes.
//
//  Each scene is rebuilt on every transition, so a per-scene timer would keep
//  resetting. Instead we stash an ABSOLUTE end time (ms) in the registry and
//  every scene just renders "how much is left" against it -- the clock keeps
//  ticking no matter which scene is on screen, and any scene can end the game.

const GAME_DURATION_MS = 60000;   //  60 seconds per game -- tweak to taste.

//  Make sure a shared deadline exists. The clock starts on the first call after
//  a reset (timerEnd === null), so time isn't drained while sitting in a menu.
export function ensureDeadline (registry)
{
    let deadline = registry.get('timerEnd');
    if (!deadline)
    {
        deadline = Date.now() + GAME_DURATION_MS;
        registry.set('timerEnd', deadline);
    }
    return deadline;
}

//  Shift the shared deadline by deltaMs (positive = add time, negative = remove).
//  Used by the build-the-label flow: correct picks +5s, wrong picks -5s, hand-in
//  +10s. Ensures the clock is running first so an adjustment never no-ops while
//  timerEnd is still null.
export function adjustDeadline (registry, deltaMs)
{
    const end = ensureDeadline(registry);
    registry.set('timerEnd', end + deltaMs);
}

//  Draw a golden-yellow countdown at (x, y) that refreshes ~4x/sec and forces
//  the GameOver scene the moment it reaches zero. Returns { text, tick } -- call
//  tick() to repaint immediately (e.g. right after adjustDeadline) and get the
//  remaining ms back; it also fires GameOver itself if time has run out.
export function startCountdown (scene, x, y, fontSize = 30)
{
    //  Start the clock if it isn't already running. The tick reads the deadline
    //  back from the registry every time (NOT a captured value) so mid-scene
    //  adjustments -- e.g. a wrong pick's -5s -- show up live.
    ensureDeadline(scene.registry);

    const text = crispText(scene, x, y, '', {
        fontFamily: 'Roboto Black',
        fontSize,
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5);

    let fired = false;   //  guard so we only start GameOver once
    const tick = () => {
        const deadline = scene.registry.get('timerEnd');
        const remaining = deadline ? Math.max(0, deadline - Date.now()) : 0;
        text.setText(`Time: ${Math.ceil(remaining / 1000)}`);

        if (remaining <= 0 && !fired)
        {
            fired = true;
            scene.scene.start('GameOver');
        }

        return remaining;
    };

    tick();   //  paint immediately so there's no blank frame
    scene.time.addEvent({ delay: 250, loop: true, callback: tick });

    return { text, tick };
}
