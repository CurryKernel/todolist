class AnimationsModule {
  constructor() {
    this.enabled = true;
  }

  init() {
    const settings = window.store.getSettings();
    this.enabled = settings.wangYuanMode !== false;
    window.store.on('settings-change', (s) => {
      this.enabled = s.wangYuanMode !== false;
    });
  }

  spawnNotes(x, y) {
    if (!this.enabled) return;

    const notes = ['♪', '♫', '♬', '🎵', '🎶', '✨', '💚', '🍀'];
    const colors = ['#7BC8A4', '#5BA88A', '#8BC34A', '#D4EDE0'];

    for (let i = 0; i < 8; i++) {
      const note = document.createElement('span');
      note.textContent = notes[Math.floor(Math.random() * notes.length)];
      note.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        font-size: ${14 + Math.random() * 16}px;
        color: ${colors[Math.floor(Math.random() * colors.length)]};
        pointer-events: none;
        z-index: 9999;
        opacity: 1;
        transition: all 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
      `;
      document.body.appendChild(note);

      // Trigger animation in next frame
      requestAnimationFrame(() => {
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 40 + Math.random() * 60;
        note.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - 50}px) rotate(${Math.random() * 360}deg)`;
        note.style.opacity = '0';
      });

      // Cleanup
      setTimeout(() => note.remove(), 850);
    }
  }

  fadeIn(element, duration = 200) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    requestAnimationFrame(() => { element.style.opacity = '1'; });
  }

  slideIn(element, from = 'right', duration = 250) {
    const offsets = { right: '20px', left: '-20px', top: '-20px', bottom: '20px' };
    element.style.opacity = '0';
    element.style.transform = `translate(${offsets[from] || '20px'})`;
    element.style.transition = `all ${duration}ms ease`;
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0)';
    });
  }
}

window.Animations = new AnimationsModule();
