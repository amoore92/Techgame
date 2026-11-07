import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { Settings } from './scenes/Settings';
import { Setname } from './scenes/Setname';
import { Inventory } from './scenes/Inventory';
import { LabelIndications, LabelSideEffects, LabelWarnings } from './scenes/LabelScene';
import { MainMenu } from './scenes/MainMenu';
import { Scoreboard } from './scenes/Scoreboard';
import { Preloader } from './scenes/Preloader';
import { AUTO, Game, Scale } from 'phaser';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 720,
    height: 1280,
    parent: 'game-container',
    pixelArt: false,
    backgroundColor: '#253237',
    dom: {
        createContainer: true
    },
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Scoreboard,
        MainGame,
        Settings,
        Setname,
        Inventory,
        LabelIndications,
        LabelSideEffects,
        LabelWarnings,
        GameOver
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;
