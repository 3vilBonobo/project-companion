import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class InteractionFeedbackService {
  private readonly document = inject(DOCUMENT);
  private readonly settings = inject(SettingsService);

  questStarted(): void {
    this.play([{ frequency: 392, duration: .08 }, { frequency: 523, duration: .12, delay: .07 }]);
    this.vibrate([18]);
  }

  questCompleted(achievementUnlocked = false): void {
    const notes = achievementUnlocked
      ? [{ frequency: 523, duration: .09 }, { frequency: 659, duration: .09, delay: .08 }, { frequency: 784, duration: .18, delay: .16 }]
      : [{ frequency: 440, duration: .08 }, { frequency: 554, duration: .08, delay: .07 }, { frequency: 659, duration: .14, delay: .14 }];
    this.play(notes);
    this.vibrate(achievementUnlocked ? [30, 25, 45, 25, 70] : [30, 30, 60]);
  }

  preview(): void { this.play([{ frequency: 523, duration: .08 }, { frequency: 659, duration: .13, delay: .07 }]); }

  private play(notes: Array<{ frequency: number; duration: number; delay?: number }>): void {
    if (!this.settings.settings().soundEffectsEnabled) return;
    const view = this.document.defaultView;
    if (!view) return;
    const AudioContextConstructor = view.AudioContext ?? (view as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;
    try {
      const context = new AudioContextConstructor();
      const start = context.currentTime;
      for (const note of notes) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const at = start + (note.delay ?? 0);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.frequency, at);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(.075, at + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, at + note.duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + note.duration + .02);
      }
      view.setTimeout(() => void context.close(), 700);
    } catch {
      // Feedback is optional; restricted browsers may refuse audio contexts.
    }
  }

  private vibrate(pattern: number[]): void {
    if (this.settings.settings().reducedMotion) return;
    this.document.defaultView?.navigator.vibrate?.(pattern);
  }
}
