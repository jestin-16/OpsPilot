import { describe, expect, it } from 'vitest';
import { appendCapped, maxId, type LogWindow } from './logBuffer';
import type { ProjectLogEntry } from '../services/projectApi';

const entry = (id: number): ProjectLogEntry => ({
  id: String(id), projectId: 1, level: 'INFO', message: `m${id}`, timestamp: '2024-05-01T10:00:00Z', metadata: {},
});
const empty: LogWindow = { entries: [], dropped: 0 };

describe('appendCapped', () => {
  it('appends in order', () => {
    const w = appendCapped(appendCapped(empty, [entry(1), entry(2)]), [entry(3)]);
    expect(w.entries.map((e) => e.id)).toEqual(['1', '2', '3']);
  });

  it('skips entries that are already shown (history/stream overlap)', () => {
    const w = appendCapped(appendCapped(empty, [entry(1), entry(2)]), [entry(2), entry(3), entry(3)]);
    expect(w.entries.map((e) => e.id)).toEqual(['1', '2', '3']);
  });

  it('drops the oldest lines beyond the cap and counts them', () => {
    const w = appendCapped(appendCapped(empty, [entry(1), entry(2), entry(3)], 3), [entry(4), entry(5)], 3);
    expect(w.entries.map((e) => e.id)).toEqual(['3', '4', '5']);
    expect(w.dropped).toBe(2);
  });

  it('returns the same object when nothing changes so React can skip a render', () => {
    const w = appendCapped(empty, [entry(1)]);
    expect(appendCapped(w, [])).toBe(w);
    expect(appendCapped(w, [entry(1)])).toBe(w);
  });

  it('never exceeds the cap for one huge batch', () => {
    const batch = Array.from({ length: 10_000 }, (_, i) => entry(i));
    expect(appendCapped(empty, batch, 5000).entries).toHaveLength(5000);
  });
});

describe('maxId', () => {
  it('returns the largest numeric id', () => {
    expect(maxId([entry(3), entry(10), entry(7)])).toBe('10');
  });
  it('returns undefined for an empty list or non-numeric ids', () => {
    expect(maxId([])).toBeUndefined();
    expect(maxId([{ ...entry(1), id: 'abc' }])).toBeUndefined();
  });
});
