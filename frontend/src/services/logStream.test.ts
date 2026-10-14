import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openLogStream, type StreamStatus } from './logStream';
import type { ProjectLogEntry } from './projectApi';

const refreshSession = vi.hoisted(() => vi.fn());
vi.mock('./api', async (importOriginal) => {
  const original = await importOriginal<typeof import('./api')>();
  return { ...original, api: { ...original.api, refreshSession } };
});

const encoder = new TextEncoder();

function sse(...events: Array<{ id: number; message: string }>): string {
  return events.map((e) => `id: ${e.id}\nevent: log\ndata: ${JSON.stringify({ id: String(e.id), projectId: 1, level: 'INFO', message: e.message, timestamp: '2024-05-01T10:00:00Z', metadata: {} })}\n\n`).join('');
}

/** A streaming Response whose body yields the given chunks, then ends (as when a server drops the connection). */
function streamResponse(chunks: string[], status = 200): Response {
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) controller.enqueue(encoder.encode(chunks[i++]));
      else controller.close();
    },
  });
  return new Response(body, { status, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('openLogStream', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    refreshSession.mockReset();
    refreshSession.mockRejectedValue(new Error('refresh failed'));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('localStorage', { getItem: () => 'tok', setItem: () => undefined, removeItem: () => undefined });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('delivers entries, sends auth and filters, and reports live', async () => {
    fetchMock.mockResolvedValueOnce(streamResponse([sse({ id: 1, message: 'a' }), sse({ id: 2, message: 'b' })]));
    fetchMock.mockImplementation(() => new Promise(() => undefined)); // later reconnects hang
    const got: ProjectLogEntry[] = [];
    const statuses: StreamStatus[] = [];
    const close = openLogStream({ projectId: 7, filters: { level: 'ERROR', integrationId: 3, q: 'db' }, onEntries: (b) => got.push(...b), onStatus: (s) => statuses.push(s) });

    await vi.advanceTimersByTimeAsync(10);

    expect(got.map((e) => e.message)).toEqual(['a', 'b']);
    expect(statuses).toContain('live');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/projects/7/logs/stream?');
    expect(String(url)).toContain('level=ERROR');
    expect(String(url)).toContain('integrationId=3');
    expect(String(url)).toContain('q=db');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok', Accept: 'text/event-stream' });
    close();
  });

  it('reconnects after the connection drops and resumes from the last id', async () => {
    fetchMock.mockResolvedValueOnce(streamResponse([sse({ id: 41, message: 'x' }), sse({ id: 42, message: 'y' })]));
    fetchMock.mockResolvedValueOnce(streamResponse([sse({ id: 43, message: 'z' })]));
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    const got: string[] = [];
    const statuses: StreamStatus[] = [];
    const close = openLogStream({ projectId: 1, filters: {}, onEntries: (b) => got.push(...b.map((e) => e.message)), onStatus: (s) => statuses.push(s) });

    await vi.advanceTimersByTimeAsync(10);
    expect(statuses).toContain('reconnecting');
    await vi.advanceTimersByTimeAsync(2000); // backoff

    expect(got).toEqual(['x', 'y', 'z']);
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toMatchObject({ 'Last-Event-ID': '42' });
    close();
  });

  it('keeps retrying after a network error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network down'));
    fetchMock.mockResolvedValueOnce(streamResponse([sse({ id: 1, message: 'back' })]));
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    const got: string[] = [];
    const close = openLogStream({ projectId: 1, filters: {}, onEntries: (b) => got.push(...b.map((e) => e.message)), onStatus: () => undefined });

    await vi.advanceTimersByTimeAsync(2500);

    expect(got).toEqual(['back']);
    close();
  });

  it('starts from the supplied Last-Event-ID so history and stream do not leave a gap', async () => {
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    const close = openLogStream({ projectId: 1, filters: {}, lastEventId: '99', onEntries: () => undefined, onStatus: () => undefined });
    await vi.advanceTimersByTimeAsync(5);
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ 'Last-Event-ID': '99' });
    close();
  });

  it('gives up with a clear error when access is denied and a refresh is not possible', async () => {
    fetchMock.mockResolvedValue(new Response('no', { status: 403 }));
    const statuses: Array<[StreamStatus, string | undefined]> = [];
    openLogStream({ projectId: 1, filters: {}, onEntries: () => undefined, onStatus: (s, d) => statuses.push([s, d]) });

    await vi.advanceTimersByTimeAsync(50);

    const last = statuses[statuses.length - 1];
    expect(last[0]).toBe('error');
    expect(last[1]).toMatch(/access|session/i);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2); // original + at most one post-refresh retry, never a loop
  });

  it('refreshes an expired token once and continues with the new one', async () => {
    refreshSession.mockResolvedValue({ token: 'fresh' });
    fetchMock.mockResolvedValueOnce(new Response('expired', { status: 401 }));
    fetchMock.mockResolvedValueOnce(streamResponse([sse({ id: 1, message: 'after refresh' })]));
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    const got: string[] = [];
    const close = openLogStream({ projectId: 1, filters: {}, onEntries: (b) => got.push(...b.map((e) => e.message)), onStatus: () => undefined });

    await vi.advanceTimersByTimeAsync(20);

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(got).toEqual(['after refresh']);
    close();
  });

  it('ignores malformed events and non-log events without dying', async () => {
    fetchMock.mockResolvedValueOnce(streamResponse(['id: 1\nevent: log\ndata: {not json\n\n', ': keepalive\n\n', 'event: other\ndata: {}\n\n', sse({ id: 2, message: 'ok' })]));
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    const got: string[] = [];
    const close = openLogStream({ projectId: 1, filters: {}, onEntries: (b) => got.push(...b.map((e) => e.message)), onStatus: () => undefined });
    await vi.advanceTimersByTimeAsync(10);
    expect(got).toEqual(['ok']);
    close();
  });

  it('stops for good once closed', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(streamResponse([])));
    const close = openLogStream({ projectId: 1, filters: {}, onEntries: () => undefined, onStatus: () => undefined });
    await vi.advanceTimersByTimeAsync(10);
    close();
    const calls = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(fetchMock.mock.calls.length).toBe(calls);
  });
});
