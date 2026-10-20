# Phase 08 — Local Research Journal & Learning Progress

## Scope and architecture

Phase 08 keeps all Phase 06 and Phase 07 scientific behavior intact. It introduces a browser-only, local-first journal and learning-progress resume, without accounts, hosted databases, analytics or paid APIs.

- Academy saves a versioned object with the current chapter, correctly passed question IDs and teaching-graph completion. Temporary answer selections are intentionally not retained.
- Experiment Lab saves only after the learner presses **Save to journal**. Each saved record contains the original bounded graph, exact algorithm inputs, computed results, scientific provenance and all five caution statements.
- Research Journal displays records with provenance labels, offers **Reopen in Lab**, JSON export and import, single-record deletion and confirmed full reset.
- It supports original Phase 07 `neuroverse-lab/v1` JSON files as well as versioned `neuroverse-journal/v1` bundles.
- All storage operations are synchronous browser localStorage calls. This bounded approach is simpler than IndexedDB and currently avoids a backend storage schema.

## Safety, scientific interpretation and limitations

Imports are UTF-8 JSON files capped at 1.5 MB; a record is capped at 250 KB; journal storage is capped at 1.5 MB total and 12 records. Imported graphs use Phase 07's limits of 80 nodes and 250 directed edges, preserve string FAFB root identifiers, validate source fields, require matching schema versions, recompute all results through the same deterministic engine and reject altered caveats. Import is all-or-nothing, rejects corrupt or conflicting IDs, and skips content duplicates without overwriting the existing journal. It does not execute imported code.

**No source authentication claim:** Imported v783 records remain *user-supplied*. A database SHA-256, the original boolean source-metadata field or successful recomputation does not independently authenticate a Princeton / FlyWire dataset. Graph-model reachability is not neural firing, a biological intervention, behavior or memory.

localStorage is scoped to this website's origin and browser profile. There is **no cloud sync, automatic backup, cross-browser portability or unlimited retention guarantee**. Browsers can erase local storage. Export a journal JSON backup before clearing data or changing browsers. Academy progress is local only (not included in the journal export). Storage permission failures and malformed existing data should be reported; invalid stored values are not silently overwritten during hydration. Deleting a record or resetting all data requires explicit confirmation in the UI.

## Test and acceptance checklist

Run in `frontend`:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Test evidence must include:
- Academy cross-session reload restores correct completed questions and current chapter, while answers remain unselected.
- Synthetic Lab experiment saved, reopened, matching inputs and numerical outcomes.
- Export → clear/delete → import round-trip and idempotent duplicate handling.
- Original Phase 07 standalone export import.
- Malformed JSON, mismatched numerical results, invalid provenance fields, excessive file size, and journal schema mismatch cannot corrupt saved records.
- User confirms individual deletion and a separate confirmation for global reset.
- Mobile layout, keyboard operation and API-offline behavior.
- All earlier Phase 01–07 checks remain green.

**Manual gates not substitutable by CI:** testing localStorage on real browsers/devices, browser private mode and quota behavior, human accessibility observations and Phase 06's outstanding five-person pilot. These remain explicitly unverified unless personally executed.
