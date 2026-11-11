import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronRight, GitBranch, Search, Terminal } from 'lucide-react';
import '../styles/observability.css';

const SAMPLE_EVENTS = [
  { id: 'started', time: '12:04:01', level: 'INFO', source: 'api-service', message: 'Service started on port 8080', detail: 'The API service started and is ready to accept requests.', origin: 'Kubernetes / api-service-7d8f' },
  { id: 'ready', time: '12:04:03', level: 'INFO', source: 'web-client', message: 'Health check passed', detail: 'The web container returned HTTP 200 for its health check.', origin: 'Docker / web-client' },
  { id: 'slow', time: '12:04:06', level: 'WARN', source: 'api-service', message: 'Upstream response slow: 842ms', detail: 'An upstream request took 842ms. Inspect nearby events to see whether the slowdown persisted.', origin: 'Kubernetes / api-service-7d8f' },
  { id: 'timeout', time: '12:04:09', level: 'ERROR', source: 'api-service', message: 'Database connection timed out', detail: 'A database connection exceeded the configured timeout. Check connection availability and compare logs around the latest release.', origin: 'Kubernetes / api-service-7d8f' },
  { id: 'recovered', time: '12:04:12', level: 'INFO', source: 'api-service', message: 'Database connection restored', detail: 'The next connection attempt succeeded. Review the preceding warning and error to understand the interruption.', origin: 'Kubernetes / api-service-7d8f' },
] as const;

export function ObservabilitySection() {
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('timeout');
  const events = errorsOnly ? SAMPLE_EVENTS.filter(event => event.level === 'ERROR') : SAMPLE_EVENTS;
  const selected = events.find(event => event.id === selectedId) ?? events[0]!;

  return (
    <section id="observability" className="observability-section" aria-labelledby="observability-title">
      <div className="observability-container">
        <div className="observability-heading" data-motion>
          <div>
            <p className="observability-eyebrow">03 / OBSERVABILITY</p>
            <h2 id="observability-title">The signal.<br /><span>And the story behind it.</span></h2>
          </div>
          <p>Follow logs across your services. Narrow down the noise, inspect an event, and keep the surrounding release in view.</p>
        </div>

        <div className="observability-demo" data-motion>
          <div className="observability-toolbar">
            <div className="observability-breadcrumb"><Terminal size={16} aria-hidden="true" /><span>Workspace</span><ChevronRight size={12} aria-hidden="true" /><strong>Service logs</strong></div>
            <span className="observability-sample">Interactive preview · Sample data</span>
          </div>
          <div className="observability-demo-body">
            <div className="observability-stream">
              <div className="observability-filters">
                <div role="group" aria-label="Filter sample logs">
                  <button type="button" aria-pressed={!errorsOnly} aria-controls="observability-events" onClick={() => setErrorsOnly(false)}>All events <span>{SAMPLE_EVENTS.length}</span></button>
                  <button type="button" aria-pressed={errorsOnly} aria-controls="observability-events" onClick={() => setErrorsOnly(true)}>Errors only <span>1</span></button>
                </div>
                <span>production</span>
              </div>
              <div className="observability-list-heading"><span>TIME / LEVEL</span><span>EVENT</span></div>
              <div id="observability-events" role="group" aria-label="Sample log events" className="observability-events">
                {events.map(event => (
                  <button key={event.id} type="button" className="observability-event" aria-pressed={selected.id === event.id} aria-controls="observability-event-detail" onClick={() => setSelectedId(event.id)}>
                    <span className="observability-event-meta"><time>{event.time}</time><span className={`observability-level is-${event.level.toLowerCase()}`}>{event.level}</span></span>
                    <span className="observability-event-copy"><strong>{event.message}</strong><span>{event.source}</span></span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <p className="observability-event-count" role="status">Showing {events.length} of {SAMPLE_EVENTS.length} sample events <span>Select an event to inspect it</span></p>
            </div>

            <div id="observability-event-detail" className="observability-detail" role="region" aria-label="Selected event details" aria-live="polite" aria-atomic="true">
              <p className="observability-eyebrow"><Search size={13} aria-hidden="true" /> EVENT DETAILS</p>
              <h3 key={selected.id}>{selected.message}</h3>
              <p className="observability-detail-description">{selected.detail}</p>
              <dl>
                <div><dt>Service</dt><dd>{selected.source}</dd></div>
                <div><dt>Source</dt><dd>{selected.origin}</dd></div>
                <div><dt>Timestamp</dt><dd>{selected.time} UTC</dd></div>
                <div><dt>Level</dt><dd>{selected.level}</dd></div>
              </dl>
              <div className="observability-release"><GitBranch size={17} aria-hidden="true" /><div><span>NEARBY DEPLOYMENT</span><strong>{selected.source === 'web-client' ? 'web-client · v1.6.2' : 'api-service · v2.8.0'}</strong><p>main · 12:03 UTC</p></div></div>
              <p className="observability-context-note">Timing adds context. It does not establish the cause.</p>
            </div>
          </div>
        </div>

        <div className="observability-footer"><p>Your logs, with their context intact.</p><Link to="/logs">Open log explorer <ArrowRight size={15} aria-hidden="true" /></Link></div>
      </div>
    </section>
  );
}
