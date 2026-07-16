class GifRotatorModule {
  constructor() {
    this.imgEl = document.getElementById('gif-img');
    this.gifs = [];
    this._index = 0;
    this._timer = null;
  }

  init() {
    this._loadGifList();
    this._pick();
    this._scheduleNext();

    // Double-click to switch
    this.imgEl.addEventListener('dblclick', () => {
      this._switchNow();
    });
  }

  _loadGifList() {
    this.gifs = [
      '一二咬布布.gif','一二布布最最好.gif','一二布布跳舞.gif',
      'yierbubu1.gif','yierbubu2.gif','yierbubu3.gif','yierbubu4.gif','yierbubu5.gif',
      'yierbubu6.gif','yierbubu7.gif','yierbubu8.gif','yierbubu9.gif','yierbubu10.gif',
      'yierbubu11.gif','yierbubu12.gif','yierbubu13.gif','yierRole.gif',
      'angry.gif','heart.gif','hug.gif','shocked.gif','think.gif',
      'crying1.gif','crying2.gif','crying3.gif','crying4.gif','crying5.gif','crying6.gif',
      '006E4joily1hbup5re0vyg303c03cmy7.gif','a8e0ae7fly1hbtkrw8q7gg206o06o0wg.gif',
      '一二白眼.gif','一二贴贴布布.gif','一二走路.gif','一二遛狗.gif','举牌一二.gif',
      '化妆一二.gif','吃汉堡一二.gif','吃辣条一二.gif','喝奶茶一二.gif',
      '孙悟空一二，猪八戒布布.gif','安静一二（待机）.gif','开心一二.gif',
      '开车一二宝.gif','打扫卫生一二.gif','敲鼓布布.gif','无聊一二.gif',
      '洗澡一二.gif','涂口红一二.gif','玩手机一二.gif','生气一二.gif',
      '看书一二.gif','睡觉一二.gif','睡觉觉一二.gif','离家出走一二.gif',
      '荡秋千一二.gif','记录一二.gif','跳草裙舞一二.gif','蹦蹦跳跳一二.gif',
      '躺床上玩手机一二.gif','锻炼一二.gif','鬼脸.gif'
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
    this.imgEl.src = `assets/gifs/${this.gifs[this._index]}`;
  }

  _switchNow() {
    if (this._timer) clearTimeout(this._timer);
    this.imgEl.style.opacity = '0';
    setTimeout(() => {
      this._pick();
      this.imgEl.style.opacity = '1';
      this._scheduleNext();
    }, 250);
  }

  _scheduleNext() {
    this._timer = setTimeout(() => {
      this.imgEl.style.opacity = '0';
      setTimeout(() => {
        this._pick();
        this.imgEl.style.opacity = '1';
        this._scheduleNext();
      }, 250);
    }, 15 * 60 * 1000); // 15 minutes
  }
}

window.GifRotator = new GifRotatorModule();
