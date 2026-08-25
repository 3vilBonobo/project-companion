import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;

  has(key: string): boolean { return this.storage?.getItem(key) !== null; }

  get<T>(key: string, fallback: T): T {
    const value = this.storage?.getItem(key);
    if (!value) return fallback;
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }

  set<T>(key: string, value: T): boolean {
    try {
      this.storage?.setItem(key, JSON.stringify(value));
      return this.storage !== undefined;
    } catch {
      return false;
    }
  }
  remove(key: string): void { this.storage?.removeItem(key); }
}
