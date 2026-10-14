import { describe, expect, it } from 'vitest';
import { SseParser, backoffDelay } from './sse';

describe('SseParser', () => {
  it('parses a complete message with id and event', () => {
    const p = new SseParser();
    expect(p.push('id: 12\nevent: log\ndata: {"a":1}\n\n')).toEqual([{ id: '12', event: 'log', data: '{"a":1}' }]);
  });

  it('handles messages split across arbitrary chunks', () => {
    const p = new SseParser();
    const out = [
      ...p.push('id: 1\nev'),
      ...p.push('ent: log\nda'),
      ...p.push('ta: hello\n'),
      ...p.push('\nid: 2\nevent: log\ndata: world\n\n'),
    ];
    expect(out.map((m) => [m.id, m.data])).toEqual([['1', 'hello'], ['2', 'world']]);
  });

  it('accepts CRLF line endings, including a split CR/LF pair', () => {
    const p = new SseParser();
    const out = [...p.push('data: a\r'), ...p.push('\n\r\n'), ...p.push('data: b\r\n\r\n')];
    expect(out.map((m) => m.data)).toEqual(['a', 'b']);
  });

  it('joins multi-line data and defaults the event name', () => {
    const p = new SseParser();
    expect(p.push('data: one\ndata: two\n\n')).toEqual([{ id: undefined, event: 'message', data: 'one\ntwo' }]);
  });

  it('ignores keepalive comments and does not emit empty messages', () => {
    const p = new SseParser();
    expect(p.push(': keepalive\n\n: keepalive\n\n')).toEqual([]);
    expect(p.push('data: x\n\n')).toHaveLength(1);
  });

  it('does not leak an id into the next message', () => {
    const p = new SseParser();
    const out = p.push('id: 5\ndata: a\n\ndata: b\n\n');
    expect(out[1].id).toBeUndefined();
  });
});

describe('backoffDelay', () => {
  it('grows exponentially and caps at 30s', () => {
    const none = () => 0;
    expect([0, 1, 2, 3].map((n) => backoffDelay(n, none))).toEqual([1000, 2000, 4000, 8000]);
    expect(backoffDelay(10, none)).toBe(30_000);
  });

  it('adds at most 25% jitter', () => {
    expect(backoffDelay(0, () => 1)).toBe(1250);
  });
});
