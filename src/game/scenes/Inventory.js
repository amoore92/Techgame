import { BuildStepScene } from './LabelScene';

//  First step of building a drug to hand over: pick the correct drug for the
//  patient's greeting. Uses the SAME drag-onto-the-label mechanic as the three
//  label steps -- drag the right drug name onto the paper's whitespace. Correct
//  -> +5s/+5pts and on to the indications step; wrong -> -5s and a red flash.
export class Inventory extends BuildStepScene
{
    constructor ()
    {
        super('Inventory', {
            optionsKey: 'drugOptions',
            progressKey: 'picked',
            heading: 'Drug',
            context: (round) => round.greetingText,
            next: 'LabelIndications',
        });
    }
}
