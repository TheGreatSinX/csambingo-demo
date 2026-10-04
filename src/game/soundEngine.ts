// Web Audio API Synthesizer & Speech Caller for Classic Bingo

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private voiceEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  // Authentic Ink Dauber "Thump / Pop" sound
  public playDaub() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Punchy transient thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);

      // Light wet pop resonance
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(680, now);
      popOsc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
      popGain.gain.setValueAtTime(0.12, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      popOsc.connect(popGain);
      popGain.connect(this.ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.04);
    } catch {}
  }

  // Alias for backward compatibility
  public playCellMark() {
    this.playDaub();
  }

  // Soft button click
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  // Mechanical ball roll + cheerful game-show chime when a new ball is drawn
  public playBallRoll() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Happy bouncy ball pops
      [0, 0.06, 0.12].forEach((delay, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420 + idx * 110, now + delay);
        osc.frequency.exponentialRampToValueAtTime(680 + idx * 120, now + delay + 0.05);

        gain.gain.setValueAtTime(0.14, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.055);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.055);
      });

      // Bright, happy two-note major sparkle ding (E5 -> G#5 -> B5)
      const chimeNotes = [
        { freq: 659.25, start: 0.16, dur: 0.12 },
        { freq: 830.61, start: 0.22, dur: 0.14 },
        { freq: 987.77, start: 0.28, dur: 0.22 },
      ];
      chimeNotes.forEach(({ freq, start, dur }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.12, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {}
  }

  public playDrawPing() {
    this.playBallRoll();
  }

  // Cheerful, energetic Bingo Hall calls & rhymes for extra fun vibes
  private getHappyBingoFlair(num: number): string {
    const specialCalls: Record<number, string> = {
      1: "Kelly's eye, number one!",
      2: "One little duck, number two!",
      3: "Cup of tea, number three!",
      4: "Knock at the door, number four!",
      5: "Man alive, number five!",
      7: "Lucky, lucky seven!",
      8: "Garden gate, number eight!",
      9: "Doctor's orders, number nine!",
      10: "Big ten, right on the mark!",
      11: "Legs eleven! Wooo!",
      12: "One dozen, number twelve!",
      15: "Young and keen, fifteen!",
      16: "Sweet sixteen!",
      18: "Coming of age, eighteen!",
      20: "One score, twenty!",
      21: "Key of the door, twenty-one!",
      22: "Two little ducks, quack quack, twenty-two!",
      24: "Two dozen, twenty-four!",
      25: "Duck and dive, twenty-five!",
      30: "Dirty Gertie, number thirty!",
      32: "Buckle my shoe, thirty-two!",
      33: "All the threes, thirty-three!",
      35: "Jump and jive, thirty-five!",
      40: "Life begins at forty!",
      44: "Droopy drawers, forty-four!",
      45: "Halfway there, forty-five!",
      50: "Half a century, golden fifty!",
      55: "All the fives, fifty-five!",
      60: "Five dozen, sixty!",
      66: "Clickety click, sixty-six!",
      70: "Three score and ten, seventy!",
      71: "Bang on the drum, seventy-one!",
      75: "Top of the shop, seventy-five!",
    };

    if (specialCalls[num]) {
      return specialCalls[num];
    }

    const happyBoosters = [
      "Daub it if you got it!",
      "Check those cards!",
      "Ooh, that's a lucky one!",
      "Getting closer to Bingo!",
      "Love to see it!",
      "Keep those daubers ready!",
      "Hot off the cage!",
      "Let's go, let's go!",
    ];
    return happyBoosters[num % happyBoosters.length];
  }

  // Energetic, excited, and happy Voice Caller using Web Speech API
  public announceBall(label: string) {
    if (this.isMuted || !this.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop prior callout

      const happyIntros = [
        "Here we go!",
        "Next up!",
        "Hot ball rolling out!",
        "Ooh, look at this!",
        "Alrighty!",
        "Let's go!",
        "Eyes on your board!",
        "Spinning the cage!",
      ];
      const randomIntro = happyIntros[Math.floor(Math.random() * happyIntros.length)];

      let textToSpeak = `${randomIntro} ${label}!`;
      const match = label.match(/^([BINGO])-?(\d+)$/i);
      if (match) {
        const letter = match[1].toUpperCase();
        const num = parseInt(match[2], 10);
        const flair = this.getHappyBingoFlair(num);
        textToSpeak = `${randomIntro} ${letter} ${num}! ${letter}, ${num}! ${flair}`;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      // Higher rate & pitch give an upbeat, smiling, energetic game-show host tone
      utterance.rate = 1.12;
      utterance.pitch = 1.24;
      utterance.volume = 1.0;

      // Prefer bright, expressive English voices
      const voices = window.speechSynthesis.getVoices();
      const livelyVoice =
        voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Aria') || v.name.includes('Zira') || v.name.includes('Natural'))) ||
        voices.find(v => v.lang.startsWith('en'));

      if (livelyVoice) {
        utterance.voice = livelyVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis not available
    }
  }

  // Triumphant classic bingo victory fanfare
  public playBingoVictory() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Grand C Major / G Major Celebration Fanfare
      const notes = [
        { f: 523.25, t: 0.0, d: 0.12 }, // C5
        { f: 659.25, t: 0.12, d: 0.12 }, // E5
        { f: 783.99, t: 0.24, d: 0.12 }, // G5
        { f: 1046.50, t: 0.36, d: 0.40 }, // C6
        { f: 880.00, t: 0.80, d: 0.15 }, // A5
        { f: 1046.50, t: 0.95, d: 0.60 }, // High C6 triumphant hold
      ];

      notes.forEach(({ f, t, d }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(0.24, now + t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + d);
      });

      // Excited, joyful BINGO winner callout!
      if (this.voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setTimeout(() => {
          try {
            window.speechSynthesis.cancel();
            const shout = new SpeechSynthesisUtterance(
              "BINGO! Woohoo! Hold the cage, we have a superstar Bingo winner in the house! Fantastic job, congratulations!"
            );
            shout.rate = 1.14;
            shout.pitch = 1.28;
            shout.volume = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const livelyVoice =
              voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Aria') || v.name.includes('Zira') || v.name.includes('Natural'))) ||
              voices.find(v => v.lang.startsWith('en'));
            if (livelyVoice) shout.voice = livelyVoice;

            window.speechSynthesis.speak(shout);
          } catch {}
        }, 250);
      }
    } catch {}
  }

  // Error buzzer on false claim
  public playError() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(105, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }
}

export const sound = new SoundEngine();
