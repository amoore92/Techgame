import { Scene } from 'phaser';
import { crispText } from './ui';

//  A small name-entry screen. Reached two ways:
//    - from MainMenu PLAY when no name has been set this session (-> Game)
//    - from Settings via "Set Name" (-> back to Settings, no game starts)
//  The destination is passed in as scene data { next: 'Game' | 'Settings' }.
export class Setname extends Scene
{
    constructor ()
    {
        super('Setname');
    }

    init (data)
    {
        this.nextScene = (data && data.next) || 'Game';
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x222244);

        crispText(this,360, 280, 'Enter your name', {
            fontFamily: 'Roboto Black', fontSize: 48, color: '#ffffff',
            stroke: '#000000', strokeThickness: 7, align: 'center'
        }).setOrigin(0.5);

        //  A REAL <input> element. Phaser's keyboard plugin only hears hardware
        //  keys, so on phones it never raises the soft keyboard -- only a focused
        //  DOM input does. This one input handles desktop AND mobile typing.
        const el = document.createElement('input');
        el.type = 'text';
        el.maxLength = 16;
        el.placeholder = 'Your name';
        el.value = this.registry.get('playerName') || '';
        el.style.cssText = [
            'width: 420px',
            'padding: 14px',
            'font-family: Roboto, Arial, sans-serif',
            'font-size: 40px',
            'font-weight: 900',
            'text-align: center',
            'color: #222244',
            'background: #ffffff',
            'border: 4px solid #FFD700',
            'border-radius: 12px',
            'outline: none'
        ].join(';');

        this.nameInput = el;
        this.add.dom(360, 440, el);

        //  Enter submits, same as the Confirm button.
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.confirm();
        });

        //  Desktop convenience: focus so you can type right away. On mobile the
        //  keyboard opens when the user TAPS the box (browsers require a tap
        //  gesture), which is why the hint below says so.
        this.time.delayedCall(50, () => el.focus());

        crispText(this,360, 560, 'Tap the box to type, then press Enter or Confirm', {
            fontFamily: 'Roboto Black', fontSize: 24, color: '#cccccc',
            stroke: '#000000', strokeThickness: 4, align: 'center'
        }).setOrigin(0.5);

        this.createMenuButton(360, 720, 'Confirm', () => this.confirm());
    }

    confirm ()
    {
        const name = (this.nameInput.value || '').trim() || 'Player';
        this.registry.set('playerName', name);
        this.scene.start(this.nextScene);
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
