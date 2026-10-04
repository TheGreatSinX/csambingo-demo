// Web Audio API Synthesizer & MGM Grand Arena Male Ring Announcer Voice Caller for Classic Bingo

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private voiceEnabled: boolean = true;
  private globalMuteAllPlayers: boolean = false;
  private cachedMaleVoice: SpeechSynthesisVoice | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Pre-warm voices list when browser loads them asynchronously
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        this.cachedMaleVoice = this.selectMgmArenaMaleVoice();
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  /**
   * Returns true if the current browser viewport is on the Host Caller Stage (/host*) or Admin Console (/admin*)
   */
  public isHostOrAdminRoute(): boolean {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname || '';
    return path.startsWith('/host') || path.startsWith('/admin');
  }

  /**
   * Returns true if Sound Effects (dauber pop, click, chimes) are muted.
   * Only controlled by the user's local SFX mute button — NOT affected by global Caller mute!
   */
  public isEffectivelyMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Returns true if the Voice Caller announcement is allowed to speak:
   * - Must not be locally muted and voiceEnabled must be true
   * - If Admin "Mute All Players" is ON, the Voice Caller is muted on all Player screens (/game/*, /)
   *   so the Voice Caller announcement comes exclusively from the Host Caller Stage (/host*)!
   */
  public isCallerVoiceEffectivelyEnabled(): boolean {
    if (this.isMuted || !this.voiceEnabled) return false;
    if (this.globalMuteAllPlayers && !this.isHostOrAdminRoute()) {
      return false;
    }
    return true;
  }

  public setGlobalMuteAllPlayers(muted: boolean) {
    if (this.globalMuteAllPlayers !== muted) {
      this.globalMuteAllPlayers = muted;
      // If a player session is active and global caller mute was just turned on, immediately cancel any ongoing speech
      if (muted && !this.isHostOrAdminRoute() && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      this.notifyListeners();
    }
  }

  public getGlobalMuteAllPlayers(): boolean {
    return this.globalMuteAllPlayers;
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

  /**
   * Selects a deep, commanding, resonant professional Male Announcer voice
   * reminiscent of an MGM Grand Garden Arena championship ring announcer.
   */
  private selectMgmArenaMaleVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const englishVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (englishVoices.length === 0) return voices[0] || null;

    // Exclude known female voices so we never accidentally pick a high-pitched female voice
    const femaleKeywords = [
      'female', 'samantha', 'victoria', 'zira', 'aria', 'jenny', 'michelle',
      'sonia', 'libby', 'clara', 'natasha', 'karen', 'moira', 'tessa',
      'fiona', 'veena', 'allison', 'ava', 'susan', 'kathy', 'Vicki', 'serena'
    ];

    // Priority 1: Rich Natural / Studio Male Voices (Andrew, Christopher, Guy, Steffan, Eric, Roger, Ryan,Google UK English Male, Daniel, Alex, Fred, David)
    const preferredMaleKeywords = [
      'Christopher',
      'Guy',
      'Eric',
      'Roger',
      'Steffan',
      'Andrew',
      'Brian',
      'Davis',
      'Jason',
      'Tony',
      'Google UK English Male',
      'Microsoft Guy',
      'Microsoft Christopher',
      'Microsoft Eric',
      'Microsoft David',
      'Microsoft Mark',
      'Microsoft Ryan',
      'Daniel',
      'Alex',
      'Oliver',
      'Aaron',
      'Arthur',
      ' Gordon',
      'Male',
      'male',
      'Fred'
    ];

    for (const keyword of preferredMaleKeywords) {
      const found = englishVoices.find(
        (v) =>
          v.name.toLowerCase().includes(keyword.toLowerCase()) &&
          !femaleKeywords.some((fem) => v.name.toLowerCase().includes(fem))
      );
      if (found) return found;
    }

    // Priority 2: Any English voice that does NOT match known female names
    const nonFemaleEnglish = englishVoices.find(
      (v) => !femaleKeywords.some((fem) => v.name.toLowerCase().includes(fem))
    );
    if (nonFemaleEnglish) return nonFemaleEnglish;

    return englishVoices[0];
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.notifyListeners();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.notifyListeners();
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  // Authentic Ink Dauber "Thump / Pop" sound
  public playDaub() {
    if (this.isEffectivelyMuted()) return;
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
    if (this.isEffectivelyMuted()) return;
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

  // MGM Grand Arena Championship Brass & Bell Chime when a new ball is drawn
  public playBallRoll() {
    if (this.isEffectivelyMuted()) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Deep arena drum / sub-bass impact
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(130, now);
      subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.22);
      subGain.gain.setValueAtTime(0.28, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.24);

      // Championship Arena Bell / Brass Power Chord (D4 -> A4 -> D5)
      const arenaNotes = [
        { freq: 293.66, start: 0.04, dur: 0.28 },
        { freq: 440.00, start: 0.10, dur: 0.32 },
        { freq: 587.33, start: 0.16, dur: 0.45 },
      ];
      arenaNotes.forEach(({ freq, start, dur }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.15, now + start);
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

  // Clean, direct, professional Male Bingo Caller — announces only the drawn ball/term
  public announceBall(label: string) {
    if (!this.isCallerVoiceEffectivelyEnabled()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Clear prior announcement

      let textToSpeak = label;
      const match = label.match(/^([BINGO])-?(\d+)$/i);
      if (match) {
        const letter = match[1].toUpperCase();
        const num = parseInt(match[2], 10);
        // Professional Bingo Caller format: "B 12... B, 12."
        textToSpeak = `${letter} ${num}. ... ${letter}, ${num}.`;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      // Clear, resonant, authoritative professional male caller cadence
      utterance.rate = 0.92;
      utterance.pitch = 0.85;
      utterance.volume = 1.0;

      const maleVoice = this.cachedMaleVoice || this.selectMgmArenaMaleVoice();
      if (maleVoice) {
        this.cachedMaleVoice = maleVoice;
        utterance.voice = maleVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis not available
    }
  }

  // Triumphant Bingo Victory Fanfare & Clean Professional Caller Announcement
  public playBingoVictory(winnerNickname?: string, patternName?: string) {
    if (this.isEffectivelyMuted()) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Championship Brass Fanfare
      const notes = [
        { f: 261.63, t: 0.0, d: 0.14 },  // C4
        { f: 329.63, t: 0.14, d: 0.14 }, // E4
        { f: 392.00, t: 0.28, d: 0.14 }, // G4
        { f: 523.25, t: 0.42, d: 0.42 }, // C5
        { f: 440.00, t: 0.86, d: 0.16 }, // A4
        { f: 523.25, t: 1.04, d: 0.70 }, // C5 Grand Hold
      ];

      notes.forEach(({ f, t, d }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(0.18, now + t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + d);
      });

      // Clean, professional Bingo Winner announcement with Winner Found & Winner Name (only if Caller Voice is enabled for this session)
      if (this.isCallerVoiceEffectivelyEnabled() && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setTimeout(() => {
          if (!this.isCallerVoiceEffectivelyEnabled()) return;
          try {
            window.speechSynthesis.cancel();
            const cleanName = winnerNickname?.trim();
            const textToSpeak = cleanName
              ? `Winner Found! Bingo! Congratulations to ${cleanName}${patternName ? ` with ${patternName}` : ''}!`
              : 'Winner Found! Bingo! We have a verified winner.';

            const shout = new SpeechSynthesisUtterance(textToSpeak);
            shout.rate = 0.92;
            shout.pitch = 0.85;
            shout.volume = 1.0;

            const maleVoice = this.cachedMaleVoice || this.selectMgmArenaMaleVoice();
            if (maleVoice) shout.voice = maleVoice;

            window.speechSynthesis.speak(shout);
          } catch {}
        }, 250);
      }
    } catch {}
  }

  // Error buzzer on false claim
  public playError() {
    if (this.isEffectivelyMuted()) return;
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

