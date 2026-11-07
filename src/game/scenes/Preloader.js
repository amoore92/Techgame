import { Scene } from 'phaser';
import { PERSON_KEYS, parseTemplate, parseNames, parseDrugs, makeRound, freshProgress } from '../roundLogic';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        this.load.image('Frame', 'Frame.png');
        this.load.image('Drug Card', 'Drug card.png');
        //  Full-bleed scene art (authored at 1440x2560 = 2x the 720x1280 world).
        this.load.image('MainBg', 'Main.png');       //  MainMenu background (title built in)
        this.load.image('GameBg', 'Background.png');  //  Game background (score/time box built in)
        this.load.image('GameFg', 'Foreground.png');  //  Game foreground (counter, over the person)
        this.load.text('Greetings', 'pharmacy_pickup_sentence_templates.txt')
        this.load.text('Names', 'name_generator_folded_pairs.txt')
        //  Rich flashcard data: generic, brand, class, indications, side effects,
        //  warnings -- the source for both the drug-pick and the label scenes.
        this.load.text('Drugs', 'pharmacy_flashcards_detailed_corrected.csv')

        //  Customer figures (500x500 SVGs). Rasterised at 2x the largest on-screen
        //  size so they stay crisp on high-DPI phones. Texture key == file stem.
        for (const key of PERSON_KEYS)
        {
            this.load.svg(key, `People/${key}.svg`, { width: 760, height: 760 });
        }
    }

    create ()
    {
        //global
        const templateText = this.cache.text.get('Greetings');
        const nameText = this.cache.text.get('Names');
        const drugText = this.cache.text.get('Drugs');

        this.templates = parseTemplate(templateText);
        this.names = parseNames(nameText);
        this.drugs = parseDrugs(drugText);

        const pools = { templates: this.templates, names: this.names, drugs: this.drugs };

        //  Keep the pools around so a brand-new round can be generated after
        //  every hand-in (see makeRound in roundLogic.js, used by the Game scene).
        this.registry.set('pools', pools);
        this.registry.set('round', makeRound(pools));

        //  Per-round build progress: which steps the player has completed for the
        //  current drug. Reset on every new round (Game.handIn / GameOver.reset).
        this.registry.set('progress', freshProgress());

        //  A pending one-shot HUD message ({ text, color }) shown by the next
        //  scene's top bar -- used for the green "+5 seconds" after a correct pick.
        this.registry.set('flash', null);

        this.registry.set('score', 0);
        //  null = clock not started yet; it begins on the first Game/Inventory
        //  scene so menu time isn't counted (see ensureDeadline in timer.js).
        this.registry.set('timerEnd', null);

        //  Per-session settings: no name until the player enters one, and scored
        //  mode by default (timer + score). Freeplay disables both.
        this.registry.set('playerName', null);
        this.registry.set('mode', 'scored');

        this.scene.start('MainMenu');
    }
}
