export interface SseMessage {
  id?: string;
  event: string;
  data: string;
}

/**
 * Incremental parser for a text/event-stream body. Feed it decoded text in arbitrary chunks; it returns the complete
 * messages found so far. Comment lines (": keepalive") are consumed and reported through onActivity only.
 */
export class SseParser {
  private buffer = '';
  private id: string | undefined;
  private event = '';
  private data: string[] = [];

  push(chunk: string): SseMessage[] {
    this.buffer += chunk;
    const messages: SseMessage[] = [];
    let newline: number;
    while ((newline = this.indexOfLineEnd()) !== -1) {
      let line = this.buffer.slice(0, newline);
      const skip = this.buffer[newline] === '\r' && this.buffer[newline + 1] === '\n' ? 2 : 1;
      this.buffer = this.buffer.slice(newline + skip);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      const message = this.line(line);
      if (message) messages.push(message);
    }
    return messages;
  }

  private indexOfLineEnd(): number {
    for (let i = 0; i < this.buffer.length; i++) {
      const c = this.buffer[i];
      if (c === '\n') return i;
      if (c === '\r') {
        // a lone \r at the very end may be the first half of \r\n; wait for more input
        if (i === this.buffer.length - 1) return -1;
        return i;
      }
    }
    return -1;
  }

  private line(line: string): SseMessage | null {
    if (line === '') {
      if (this.data.length === 0 && !this.event) {
        this.id = undefined;
        return null;
      }
      const message: SseMessage = { id: this.id, event: this.event || 'message', data: this.data.join('\n') };
      this.event = '';
      this.data = [];
      this.id = undefined; // each of our events carries its own id
      return message;
    }
    if (line.startsWith(':')) return null;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    switch (field) {
      case 'data':
        this.data.push(value);
        break;
      case 'event':
        this.event = value;
        break;
      case 'id':
        if (!value.includes('\0')) this.id = value;
        break;
      default:
        break; // retry and unknown fields are ignored; reconnect timing is ours
    }
    return null;
  }
}

/** Delay before reconnect attempt n (0-based): 1s, 2s, 4s ... capped at 30s, with up to 25% jitter. */
export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(30_000, 1000 * 2 ** Math.max(0, attempt));
  return Math.round(base * (1 + random() * 0.25));
}
