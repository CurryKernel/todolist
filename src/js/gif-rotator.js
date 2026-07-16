class GifRotatorModule {
  constructor() {
    this.imgEl = document.getElementById('gif-img');
    // Generate 180 unique 一二布布 style SVG scenes
    this.scenes = this._buildScenes();
    this.index = 0;
  }

  _buildScenes() {
    const scenes = [];
    const bgColors = ['#FFF5F0','#FFF8F3','#FFF0E8','#FFFAF7','#FDE8E8','#FDF5ED'];
    const outfits1 = ['🎀','👑','🌸','💎','🌺','✨','💝','🩷','🎵','🍀'];
    const outfits2 = ['🎩','🎓','☀️','💫','🌟','🧣','🎈','🎁','🍂','💚'];
    const items = ['❤️','💕','💖','🍡','🍰','☕','🧁','🍓','🎨','📒','🪄','🫧'];
    const actions = ['wave','sit','cuddle','jump','dance','stand'];
    const texts = ['一二','布布','💚','🌸','🎀'];

    for (let i = 0; i < 180; i++) {
      const bg = bgColors[i % bgColors.length];
      const o1 = outfits1[i % outfits1.length];
      const o2 = outfits2[i % outfits2.length];
      const item = items[Math.floor(i / 3) % items.length];
      const action = actions[i % actions.length];
      const sceneType = i % 3;
      scenes.push({ bg, o1, o2, item, action, sceneType, id: i });
    }
    return scenes;
  }

  _drawScene(ctx, w, h, scene) {
    // Background
    ctx.fillStyle = scene.bg;
    this._roundRect(ctx, 0, 0, w, h, 14);
    ctx.fill();

    if (scene.sceneType === 0) {
      // Scene: two characters side by side
      this._drawPanda(ctx, 28, 42, 22, scene.o1);
      this._drawBear(ctx, 60, 42, 24, scene.o2);
      // Item between them
      ctx.font = '14px serif'; ctx.textAlign = 'center';
      ctx.fillText(scene.item, 44, 28);
    } else if (scene.sceneType === 1) {
      // Scene: panda alone with item
      this._drawPanda(ctx, 44, 44, 26, scene.o1);
      ctx.font = '18px serif'; ctx.textAlign = 'center';
      ctx.fillText(scene.item, 44, 20);
    } else {
      // Scene: bear alone with item
      this._drawBear(ctx, 44, 44, 26, scene.o2);
      ctx.font = '16px serif'; ctx.textAlign = 'center';
      ctx.fillText(texts[i % texts.length], 44, 20);
    }

    // Border
    ctx.strokeStyle = '#F0E0D6'; ctx.lineWidth = 2;
    this._roundRect(ctx, 1, 1, w - 1, h - 1, 14);
    ctx.stroke();
  }

  _drawPanda(ctx, cx, cy, size, outfit) {
    // Body (white)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.7, 0, Math.PI * 2); ctx.fill();
    // Left ear (black)
    ctx.fillStyle = '#333333';
    ctx.beginPath(); ctx.arc(cx - size * 0.45, cy - size * 0.55, size * 0.22, 0, Math.PI * 2); ctx.fill();
    // Right ear (black)
    ctx.beginPath(); ctx.arc(cx + size * 0.45, cy - size * 0.55, size * 0.22, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#333333';
    ctx.beginPath(); ctx.arc(cx - size * 0.2, cy - size * 0.1, size * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + size * 0.2, cy - size * 0.1, size * 0.07, 0, Math.PI * 2); ctx.fill();
    // Nose
    ctx.beginPath(); ctx.arc(cx, cy + size * 0.08, size * 0.05, 0, Math.PI * 2); ctx.fill();
    // Mouth (smile)
    ctx.strokeStyle = '#333333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy + size * 0.15, size * 0.12, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    // Bow tie
    ctx.fillStyle = '#333333';
    ctx.beginPath(); ctx.moveTo(cx, cy + size * 0.35); ctx.lineTo(cx - size * 0.15, cy + size * 0.25); ctx.lineTo(cx - size * 0.15, cy + size * 0.45); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, cy + size * 0.35); ctx.lineTo(cx + size * 0.15, cy + size * 0.25); ctx.lineTo(cx + size * 0.15, cy + size * 0.45); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + size * 0.35, size * 0.06, 0, Math.PI * 2); ctx.fill();
    // Blush
    ctx.fillStyle = 'rgba(255,182,182,0.5)';
    ctx.beginPath(); ctx.ellipse(cx - size * 0.35, cy + size * 0.1, size * 0.1, size * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + size * 0.35, cy + size * 0.1, size * 0.1, size * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    // Outfit emoji
    if (outfit) {
      ctx.font = `${size * 0.5}px serif`; ctx.textAlign = 'center';
      ctx.fillText(outfit, cx, cy - size * 0.75);
    }
  }

  _drawBear(ctx, cx, cy, size, outfit) {
    // Body (brown)
    ctx.fillStyle = '#C4956A';
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.72, 0, Math.PI * 2); ctx.fill();
    // Ears
    ctx.fillStyle = '#A0724A';
    ctx.beginPath(); ctx.arc(cx - size * 0.48, cy - size * 0.55, size * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + size * 0.48, cy - size * 0.55, size * 0.2, 0, Math.PI * 2); ctx.fill();
    // Inner ears
    ctx.fillStyle = '#D4A574';
    ctx.beginPath(); ctx.arc(cx - size * 0.48, cy - size * 0.55, size * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + size * 0.48, cy - size * 0.55, size * 0.1, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#4A3020';
    ctx.beginPath(); ctx.arc(cx - size * 0.2, cy - size * 0.08, size * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + size * 0.2, cy - size * 0.08, size * 0.06, 0, Math.PI * 2); ctx.fill();
    // Nose
    ctx.fillStyle = '#6B3A2A';
    ctx.beginPath(); ctx.arc(cx, cy + size * 0.1, size * 0.07, 0, Math.PI * 2); ctx.fill();
    // Mouth
    ctx.strokeStyle = '#4A3020'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy + size * 0.18, size * 0.14, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    // Blush (lighter)
    ctx.fillStyle = 'rgba(212,165,116,0.4)';
    ctx.beginPath(); ctx.ellipse(cx - size * 0.38, cy + size * 0.12, size * 0.12, size * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + size * 0.38, cy + size * 0.12, size * 0.12, size * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    // Outfit
    if (outfit) {
      ctx.font = `${size * 0.5}px serif`; ctx.textAlign = 'center';
      ctx.fillText(outfit, cx, cy - size * 0.75);
    }
  }

  init() {
    this.pick();
    this.scheduleNext();
  }

  pick() {
    const canvas = document.createElement('canvas');
    canvas.width = 110; canvas.height = 90;
    const ctx = canvas.getContext('2d');
    const scene = this.scenes[Math.floor(Math.random() * this.scenes.length)];
    this._drawScene(ctx, 110, 90, scene);
    this.imgEl.src = canvas.toDataURL();
  }

  scheduleNext() {
    const delay = 3000 + Math.random() * 4000;
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
