import * as Phaser from 'phaser';

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: 'Game'
  };
  
  export class GameScene extends Phaser.Scene {
    private wordList: string[];
    private speech: SpeechSynthesis;
    private voice: SpeechSynthesisVoice;
    private currentWord: Phaser.GameObjects.DynamicBitmapText & { body: Phaser.Physics.Arcade.Body };
    private correctCount: Phaser.GameObjects.Text;
    private incorrectCount: Phaser.GameObjects.Text;
    private acceptInput = true;

    constructor() {
      super(sceneConfig);
    }

    preload() {
      this.load.bitmapFont('Gothic', 'assets/fonts/bitmap/gothic.png', 'assets/fonts/bitmap/gothic.xml');
      this.load.json('words', 'assets/words/100.json');      
      
      this.speech = window.speechSynthesis;     
      this.speech.onvoiceschanged = () => {
        this.voice = this.speech.getVoices().find((v) => v.name === 'Google UK English Female') || this.speech.getVoices()[0];
      };      
    }
   
    public create() {      
      const correctLabel = this.add.text(100, 100, 'Correct: ', { size: 12 });
      this.correctCount = this.add.text(100 + correctLabel.displayWidth + 5, 100, '0', { size: 12 });

      const incorrectLabel = this.add.text(100, 100 + correctLabel.displayHeight + 5, 'Incorrect: ', { size: 12 });

      this.wordList = this.cache.json.get('words').words;
      shuffle(this.wordList);

      this.physics.world.setBoundsCollision(true, true, true, true);
      this.physics.world.on('worldbounds', this.onIncorrect.bind(this));
                  
      this.currentWord = this.physics.add.existing(this.add.dynamicBitmapText(400, 100, 'Gothic', this.wordList.pop(), 100)) as Phaser.GameObjects.DynamicBitmapText & { body: Phaser.Physics.Arcade.Body };
      (this.currentWord.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
      this.currentWord.body.setCollideWorldBounds(true);    
      this.currentWord.body.onCollide = true;      

      this.currentWord.body.setVelocityY(100);
      this.currentWord.body.setVelocityX(-25);
                    
      const currentWordBounds = this.currentWord.getTextBounds().local;
      this.currentWord.body.setSize(currentWordBounds.width, currentWordBounds.height);

      this.data.set('correct', []);
      this.data.set('incorrect', []);
      this.data.set('timeout', []);

      this.acceptInput = true;
    }
   
    public update() {
        const cursorKeys = this.input.keyboard.createCursorKeys();
                console.log(this.acceptInput);
        if (this.acceptInput) {
          if (cursorKeys.down.isDown || cursorKeys.left.isDown) {
            this.acceptInput = false;
            this.onIncorrect(null);
          } else if (cursorKeys.up.isDown || cursorKeys.right.isDown) {
            this.acceptInput = false;
            this.onCorrect();
          }         
        }
    }

    onIncorrect(body) {
      this.currentWord.body.setVelocity(0, 0);
      this.currentWord.body.x = 400;
      this.currentWord.body.y = 100;
      this.currentWord.tint = 0xff0000;

      this.data.get('incorrect').push(this.currentWord.text);

      this.sayCurrentWord();  
    }

    onCorrect() {
      this.data.get('correct').push(this.currentWord.text);

      this.correctCount.setText(this.data.get('correct').length + '');

      this.nextWord();
    }

    nextWord() {
      if (this.wordList.length) {
        this.currentWord.text = this.wordList.pop();
        const currentWordBounds = this.currentWord.getTextBounds().local;
        this.currentWord.body.setSize(currentWordBounds.width, currentWordBounds.height);

        this.currentWord.tint = 0xffffff;

        this.currentWord.body.setVelocityY(100);
        this.currentWord.body.setVelocityX(-25);        
        
        this.acceptInput = true;
      }
    }

    sayCurrentWord() {
      const utterance = new SpeechSynthesisUtterance(this.currentWord.text);
      utterance.voice = this.voice;
            
      this.speech.speak(utterance);
      
      this.currentWord.text.split('').map(letter => {
        const spelling = new SpeechSynthesisUtterance(letter);
        spelling.voice = this.voice;
        spelling.rate = 0.8;
        return spelling;
      }).forEach((letter) => this.speech.speak(letter));
      
      const repeat = new SpeechSynthesisUtterance(this.currentWord.text);
      repeat.voice = this.voice;
      repeat.onend = this.nextWord.bind(this);
      this.speech.speak(repeat);
    }
  }

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Sample',
 
  type: Phaser.AUTO,
 
  scale: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
 
  physics: {
    default: 'arcade',    
    arcade: {
      debug: true,
      checkCollision: {
        down: true,
        up: true,
        left: true,
        right: true
      }
    },
  },
 
  parent: 'game',
  backgroundColor: '#000000',

  scene: GameScene
};
 
export const game = new Phaser.Game(gameConfig);