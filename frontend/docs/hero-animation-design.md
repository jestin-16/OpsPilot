# OpsPilot hero: from sources to context

The animation follows the implemented project-first workflow: connect sources,
stream their signals into one project, then relate deployment activity, runtime
events, and logs. It is an illustration, not a display of live customer data.

## Repository review

Reviewed the root README, Compose service inventory, frontend routes and API
client, integration forms, project dashboard and streaming client, backend
connector registry/runner, ingestion service, deployment service, incident and
diagnosis services, architecture documents, and the Node logging SDK overview.
This was a product/architecture review for the hero, not a line-by-line audit.

| Evidence | Design consequence |
| --- | --- |
| `src/lib/integrationTypes.ts` and `backend/shared-lib/.../connector/impl/` implement Git, CI/CD, Docker, Kubernetes and application-log connectors. | Five distinct source sculptures: a branch, pipeline, container stack, pod cluster and log stream. |
| `ConnectorRunner` funnels pull integrations into `LogIngestService`; pushes use the same ingestion path. | Several independently moving trails converge on the OpsPilot emblem. |
| `LogIngestService` assigns project/integration ownership, persists entries and publishes through `LogHub`. | One enclosing orbital boundary represents the project; sources share a central hub. |
| `src/services/logStream.ts` reconnects SSE streams; `src/lib/logBuffer.ts` bounds and deduplicates the visible log window. | A continuous flow of bounded packets, rather than an ever-growing particle field. |
| `DeploymentService` records deployments performed elsewhere and retrieves nearby project logs. | The illustration links deployment activity to runtime/log context; it does not depict OpsPilot executing a rollout. |
| `IncidentCorrelationService` groups alerts into incidents; `AiAssistantService` uses project/time-window rules. | The final chapter highlights a related signal path. No claim of autonomous AI remediation or guaranteed causal diagnosis. |
| Compose runs core, observability and log-watcher services with PostgreSQL, Prometheus, Loki, Grafana and Blackbox. | The visual emphasizes aggregation and observability rather than a generic deployment engine. |

The root README's initial architecture diagram describes older components and
broader ambitions. Current implementations and the later project-first sections
take precedence when choosing the animation's claims.

## Visual sequence

1. **Connect:** five source sculptures surround the project hub.
2. **Stream:** moving packets converge along curved paths; an ordered telemetry
   ribbon forms around the hub.
3. **Correlate:** a traveling focus links repository activity, Kubernetes runtime
   and application logs, illustrating how context becomes visible.

Keep the white background, black ASCII, floating 3D brand mark and pointer
parallax. Chapter controls allow visitors to explore the sequence directly.
Reduced-motion mode presents a still composition and permits explicit chapter
selection. Hidden tabs and offscreen artwork stop scheduling frames.

## Rendering approach

Precompute geometry, reuse character/depth buffers, cache frame/object rotations,
and avoid object/array allocation inside vertex loops. Render into a single text
node with no React render per frame. Use 30 fps on desktop and 24 fps on compact
screens, with a lower rate under sustained rendering load. Benchmark the old and
new renderers with the same frame times and pointer positions; report CPU frame
generation separately from browser layout/paint.

## Validation

Local Node 24.20.0 benchmark: 100 warm-up frames, followed by 600 frames per
renderer using identical times and pointer inputs. These numbers cover ASCII
generation only, excluding browser layout and paint.

| Renderer | Median | 95th percentile |
| --- | ---: | ---: |
| Previous orbit animation | 2.048 ms | 2.416 ms |
| Project workflow animation | 0.269 ms | 0.440 ms |

Median generation cost decreased by approximately 87%. Headless Chrome observed
46 text updates over 1.5 seconds at the desktop target of 30 fps. These are local
measurements, not a guarantee for every device.

Verified the production build, fixed frame dimensions across 600 time/camera
samples, independent renderer instances, live movement, pause/resume, chapter
selection while paused, automatic chapter advancement, offscreen suspension and
resumption, reduced-motion behavior and manual chapter exploration, white section
backgrounds, and layouts at 390 px and 320 px without horizontal overflow. Browser
validation reported no uncaught runtime errors.
