//  Shared UI helpers.

//  Device pixel ratio, capped at 2x so weaker phone GPUs aren't overworked.
//  Used as the render resolution for text: Phaser draws each text object's
//  texture at this density, so it stays sharp when the FIT canvas is scaled up
//  on high-DPI phones. (This sharpens TEXT only -- raster images need 2x art.)
export const TEXT_RES = Math.min(window.devicePixelRatio || 1, 2);

//  Drop-in replacement for `scene.add.text(x, y, text, style)` that renders at
//  device density. A caller's own `resolution` in style (none currently) wins.
export function crispText (scene, x, y, text, style)
{
    return scene.add.text(x, y, text, { resolution: TEXT_RES, ...style });
}
