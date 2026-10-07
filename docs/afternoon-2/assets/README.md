# AI SDLC with Github Copilot and HVE Core assets and screenshot capture guide

This folder contains supplied screenshots and generated diagrams for `docs\afternoon-2\workshop.md`. The four remaining screenshot captures referenced by the guide are documented below; save them with the exact filenames shown.

- `banner.png` — Supplied SDLC stage diagram used as the MOAW workshop banner, showing Setup through Operations and the rework, next-sprint, hotfix, and next-iteration paths.
- `starter-repository.png` — Supplied VS Code starter-readiness capture showing the repository layout and passing xUnit and Vitest results. This image does not establish a clean working tree.
- `l1-hve-plugin-installed.png` — Supplied Copilot CLI Installed plugins capture showing HVE-Core v3.2.2 enabled in user scope.
- `l1-hve-plugin-install-success.png` — Supplied Copilot CLI marketplace registration and plugin installation success messages, displayed after Level 1 Step 2.
- Level 1 Step 4 uses the supplied `docs\assets\vscode-hve-core.png` — VS Code Marketplace page for the `ise-hve-essentials.hve-core` extension alternative; no separate placeholder remains.
- `l2-dt-decisions.png` — Supplied VS Code capture showing the shared playlist design decisions beside a separate, proposed Level 5 mood-filter slice. The playlist document preserves the open duplicate-feedback UX choice; the later-slice document states that it is not implemented or validated.
- `l2-brd-guided-decisions.png` — Supplied Copilot CLI capture showing BRD Builder asking for measurement decisions. The Define gate remains open because the quality review report was not validated; this is not approval evidence.
- `l2-backlog-handoff-review.png` — Supplied Copilot CLI capture showing Functional Planner's handoff guidance, the user switching to Backlog Manager, and dispatch to the GitHub Backlog Executor. The capture flags incorrect operation ticks and PRD scope discrepancies; dispatch alone does not establish successful issue creation.
- `l2-sprint-planner.png` — Supplied workshop-run screenshot of sprint planning output: text-derived dependencies, implementation order, and parallel work waves. This is a captured example, not a placeholder or a required issue hierarchy.
- `l3-rpi-agent-walkthrough.png` — Supplied RPI workflow overview showing research readiness and evidence reuse, Plan with critique, Implement with validation, Review, and follow-up routing. This is a process reference, not evidence that a learner completed those phases.
- `l3-frontend-ports.png` — Supplied VS Code Ports screenshot showing the private forwarded API and frontend addresses. Open the frontend row's address for the current environment; the pictured URL is only an example.
- `l4-apm-marketplace.png` — Terminal output for APM install or audit plus repository marketplace files.
- `l4-duplicate-agent-entries.png` — Supplied VS Code Copilot Chat agent-picker screenshot showing duplicate HVE-Core names when both the plugin and repository custom agents are available. This is expected, not an installation failure.
- `l4-private-marketplace.png` — Supplied private CoffeeSoft catalog README, cropped to omit the contributor sidebar. Optional historical tutor comparison; the required participant exercise uses the template-shipped catalog, not private access.
- `l4-vscode-agentplugins.png` — VS Code Extensions view filtered with `@agentPlugins @recommended`.
- `l5-ghaw-compile.png` — Terminal output from `gh aw compile` generating lock files.
- `l5-playwright-mcp.png` — Supplied repository MCP settings screenshot for cloud agent/code review. Proctor demonstration only; not gh-aw or local client configuration.

## Remaining screenshots: resume checklist

**Capture status as of 2026-10-07:** these four image files are still missing. Their references already exist in the workshop; adding each PNG to `docs\afternoon-2\assets\` makes it available at the existing position.

Resume at the earliest capture whose prerequisites are met in your learner repository. Use actual output and the current frontend address or GitHub revision; do not run later steps just to manufacture a screenshot. Keep text readable, redact credentials and sensitive information, and label before/after or multi-panel composites explicitly. Record each supplied capture in this README when it is added.

| Image to add | When to capture and what must appear |
| --- | --- |
| **`l3-playlist-implemented.png`** | **After Level 3 implementation**, with API and Vite running. Open the **frontend**, normally port **5173**, not API port 5080; in a Codespace, use its current forwarded frontend address. Show the catalog, labelled Add controls, and playlist panel containing a synthetic track. Show the actual duplicate-feedback or disabled-button behavior chosen during planning. Ideally use a clearly labelled before/after composite to also show **"Your playlist is empty. Add a track to get started."** Do not add out-of-scope controls for the screenshot. |
| **`l5-daily-backlog-issue.png`** | **After a completed daily-backlog run produces a summary.** Show the GitHub `[Daily backlog]` issue and readable **Evidence and progress**, **Recommended implementation order**, **Needs a human decision**, and **Can be developed in parallel** sections where genuinely present. Include planning/evidence links. Do not invent parallel tasks or hide missing-evidence results. |
| **`l5-cloud-agent-assignment.png`** | **At the human assignment step.** Show the selected feature issue and the open **Assignees/Copilot task control**, including Copilot and **RPI Agent** where supported. Include bounded task instructions if the dialog exposes them. Use the learner's chosen later slice; **Remove a track is only a fallback**. If the custom-agent selector is unavailable, capture the real UI and document that limitation. |
| **`l6-cloud-agent-pr-review.png`** | **After the independent Copilot review is posted.** Show the cloud-agent PR, linked issue, agent-session link, posted review, and both **`test` and `apm-audit`** checks. Checks and review must correspond to the same PR revision. Use a labelled composite if necessary for readability. Preserve pending/failed statuses: a requested reviewer is not a completed review, and green checks are not human acceptance. |
