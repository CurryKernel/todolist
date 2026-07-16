class GifRotatorModule {
  constructor() {
    // 一二布布 themed emoji/icon set (150+ cute characters)
    this.emojis = [
      '🐼','🐻','🐼‍❄️','🐻‍❄️','🌸','💮','🏵️','🌼','🌻','🌷',
      '💐','🌺','🎀','💝','💖','💗','💓','💕','🩷','❤️',
      '🧡','💛','💚','🩵','💜','🤍','🖤','💯','✨','⭐',
      '🌟','💫','☀️','🌙','🌈','☁️','❄️','🎵','🎶','🍀',
      '🎋','🎍','🍡','🍰','🧁','🍩','🍪','🍭','🍬','🍫',
      '🎂','🥐','🍞','🧸','🎈','🎊','🎉','🎁','🫧','💎',
      '🔮','🪷','🍓','🍒','🍑','🥝','🍊','🍋','🫐','🍇',
      '🥛','🍵','☕','🧃','🥤','🧋','🐣','🐥','🦋','🐛',
      '🐞','🐌','🦊','🐰','🐱','🐶','🐷','🐮','🐸','🐨',
      '🐯','🦁','🐻‍❄️','🐧','🦆','🦉','🦩','🐙','🪼','🐠',
      '🐟','🐬','🐳','💌','💟','♥️','❣️','❤️‍🔥','🌱','🌿',
      '☘️','🍂','🍁','🎄','🌲','🪴','💐','🏡','🛝','🎠',
      '🎡','🎢','🚲','🛴','🎮','🧩','🖍️','📒','✏️','📎',
      '📌','🪄','🎨','🖼️','🧵','🪡','👑','👒','👜','👛',
      '🎒','👟','🧣','🧤','💄','💋','🫦','☮️','🕊️','🍼'
    ];
    this.currentIndex = 0;
    this.imgEl = document.getElementById('gif-img');
  }

  init() {
    this.pick();
    // Rotate every 3-5 seconds
    this.scheduleNext();
  }

  pick() {
    const emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
    // Use emoji as favicon-style display via canvas
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFF5F0';
    this._roundRect(ctx, 0, 0, 100, 100, 16);
    ctx.fill();
    ctx.font = '56px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 50, 52);

    // Add subtle border
    ctx.strokeStyle = '#F0E0D6';
    ctx.lineWidth = 2;
    this._roundRect(ctx, 1, 1, 98, 98, 16);
    ctx.stroke();

    this.imgEl.src = canvas.toDataURL();
  }

  scheduleNext() {
    const delay = 3000 + Math.random() * 3000;
    setTimeout(() => {
      this.imgEl.style.opacity = '0';
      setTimeout(() => {
        this.pick();
        this.imgEl.style.opacity = '1';
        this.scheduleNext();
      }, 200);
    }, delay);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

window.GifRotator = new GifRotatorModule();
