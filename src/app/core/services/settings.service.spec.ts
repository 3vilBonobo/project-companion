import { TestBed } from '@angular/core/testing';
import { AppTheme } from '../models/project.models';
import { StorageService } from '../storage/storage.service';
import { SettingsService } from './settings.service';

class MemoryStorage {
  readonly values = new Map<string, unknown>();
  get<T>(key: string, fallback: T): T { return (this.values.get(key) as T | undefined) ?? fallback; }
  set<T>(key: string, value: T): boolean { this.values.set(key, structuredClone(value)); return true; }
  remove(key: string): void { this.values.delete(key); }
}

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SettingsService, { provide: StorageService, useClass: MemoryStorage }] });
    service = TestBed.inject(SettingsService);
  });

  it('accepts both themed worlds', () => {
    service.update({ theme: 'wizard' });
    expect(service.settings().theme).toBe('wizard');

    service.update({ theme: 'woodland' });
    expect(service.settings().theme).toBe('woodland');
  });

  it('falls back safely when stored theme data is unsupported', () => {
    service.update({ theme: 'unknown-world' as AppTheme });
    expect(service.settings().theme).toBe('calm');
  });

  it('stores a trimmed first name with a safe maximum length', () => {
    service.update({ firstName: `  ${'A'.repeat(60)}  ` });
    expect(service.settings().firstName).toBe('A'.repeat(50));
  });
});
