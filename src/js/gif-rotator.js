class GifRotatorModule {
  constructor() {
    // 一二布布 style emoji rotator - panda + bear theme
    this.pairs = [
      ['🐼','🧸'],['🐼','🌸'],['🧸','🌼'],['🐼','💕'],['🧸','🎀'],
      ['🐼','🌿'],['🧸','🍀'],['🐼','✨'],['🧸','💝'],['🐼','🎵'],
      ['🧸','🎶'],['🐼','🍡'],['🧸','🍰'],['🐼','☕'],['🧸','🍵'],
      ['🐼','🦋'],['🧸','🌻'],['🐼','💚'],['🧸','🍂'],['🐼','🎋'],
      ['🧸','🎈'],['🐼','🫧'],['🧸','💎'],['🐼','🍓'],['🧸','🍒'],
      ['🐼','🥐'],['🧸','🧁'],['🐼','🐣'],['🧸','🦊'],['🐼','🐰'],
      ['🧸','🐱'],['🐼','🐶'],['🧸','🎨'],['🐼','📒'],['🧸','🪄'],
      ['🐼','👑'],['🧸','🌟'],['🐼','💫'],['🧸','☀️'],['🐼','🌈']
    ];
    this.imgEl = document.getElementById('gif-img');
  }

  init() {
    this.pick();
    this.scheduleNext();
  }

  pick() {
    const pair = this.pairs[Math.floor(Math.random() * this.pairs.length)];
    const canvas = document.createElement('canvas');
    canvas.width = 110; canvas.height = 90;
    const ctx = canvas.getContext('2d');

    // Warm background
    ctx.fillStyle = '#FFF5F0';
    this._roundRect(ctx, 0, 0, 110, 90, 14);
    ctx.fill();

    // Two emojis side by side
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pair[0], 35, 45);
    ctx.fillText(pair[1], 75, 45);

    // Subtle border
    ctx.strokeStyle = '#F0E0D6';
    ctx.lineWidth = 2;
    this._roundRect(ctx, 1, 1, 108, 88, 14);
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
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
}

window.GifRotator = new GifRotatorModule();
