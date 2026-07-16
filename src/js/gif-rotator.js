class GifRotatorModule {
  constructor() {
    this.imgEl = document.getElementById('gif-img');
    this.gifs = [];
    this._index = 0;
  }

  init() {
    this._loadGifList();
    this._pick();
    this._scheduleNext();
  }

  _loadGifList() {
    // All 一二布布 GIFs from assets/gifs/
    this.gifs = [
      '一二咬布布.gif','一二布布最最好.gif','一二布布跳舞.gif',
      'yierbubu1.gif','yierbubu2.gif','yierbubu3.gif','yierbubu4.gif','yierbubu5.gif',
      'yierbubu6.gif','yierbubu7.gif','yierbubu8.gif','yierbubu9.gif','yierbubu10.gif',
      'yierbubu11.gif','yierbubu12.gif','yierbubu13.gif','yierRole.gif',
      'angry.gif','heart.gif','hug.gif','shocked.gif','think.gif',
      'crying1.gif','crying2.gif','crying3.gif','crying4.gif','crying5.gif','crying6.gif',
      '006E4joily1hbup5re0vyg303c03cmy7.gif','a8e0ae7fly1hbtkrw8q7gg206o06o0wg.gif'
    ];
    // Shuffle
    for (let i = this.gifs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.gifs[i], this.gifs[j]] = [this.gifs[j], this.gifs[i]];
    }
  }

  _pick() {
    if (this.gifs.length === 0) return;
    this._index = (this._index + 1) % this.gifs.length;
    const gif = this.gifs[this._index];
    this.imgEl.src = `assets/gifs/${gif}`;
  }

  _scheduleNext() {
    const delay = 3000 + Math.random() * 4000;
    setTimeout(() => {
      this.imgEl.style.opacity = '0';
      setTimeout(() => {
        this._pick();
        this.imgEl.style.opacity = '1';
        this._scheduleNext();
      }, 250);
    }, delay);
  }
}

window.GifRotator = new GifRotatorModule();
