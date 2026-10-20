# Phase 05 — Scientific Brain Explorer Quality Gate

Branch: phase/05-scientific-brain-explorer. Status: NOT YET VERIFIED.

| Criterion | Evidence / required check |
| --- | --- |
| P05-01 Primary publication and exact underlying tissue/skeleton source | Documented in phase-05-implementation.md |
| P05-02 Pinned authentic tissue surface instead of fabricated scan | Backend checksum source smoke required |
| P05-03 Real v783 neuron skeleton binary decoded in original nm frame | Binary fixtures and real retrieval required |
| P05-04 Missing/invalid source fails closed | Backend HTTP tests |
| P05-05 Scientific camera, keyboard alternatives, mobile and WebGL fallback | Browser tests |
| P05-06 Directed graph only from configured FAFB subset with source limitations | API and UI tests |
| P05-07 Accurate long integer IDs, source units and topology | Runtime schema tests |
| P05-08 Separate geometry modes until frame alignment proven | Review |
| P05-09 Build, lint, typecheck, tests and browsers green | GitHub CI |
| P05-10 Authentic tissue + sample skeleton fetched and verified against source | Live scientific-source audit |

Do not give this phase a 10/10 score until all appropriate acceptance evidence is recorded, including real upstream source retrieval. A working build alone is insufficient.
