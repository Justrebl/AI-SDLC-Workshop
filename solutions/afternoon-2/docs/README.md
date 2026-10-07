# AI SDLC with Github Copilot and HVE Core solutions and tutor fallbacks

Use the Level 2 bundle below when the tutor needs to keep the room moving. The remaining reference documents support role demonstrations and comparison with attendee output.

## Level 2: Tutor-directed fallback

If DT coaching or BRD/PRD authoring takes too long, the tutor can offer the [Level 2 solutions archive](https://raw.githubusercontent.com/Justrebl/AI-SDLC-Workshop/refs/heads/main/solutions/afternoon-2/level2.zip). Students review supplied planning documents instead of waiting for another authoring round. This is a reference-based continuation, not proof that their DT methods, peer review, or validation were completed.

**Tutor instructions:** pause the current authoring turn and preserve the student's files and actual decisions. Explain which work remains pending. Before the session, check the archive: the URL follows `main`, so its content can change.

### Download and inspect without overwriting student work

From a Bash terminal in the student's repository, use `curl`, `unzip`, and `mktemp`:

```bash
fallback_dir="$(mktemp -d)" &&
curl -fSL https://raw.githubusercontent.com/Justrebl/AI-SDLC-Workshop/refs/heads/main/solutions/afternoon-2/level2.zip -o "$fallback_dir/level2.zip" &&
unzip -n "$fallback_dir/level2.zip" 'docs/project-planning/*' -d "$fallback_dir"
```

The output shows the temporary folder. Open its `docs/project-planning/` directory to inspect:

| Document | Use |
| --- | --- |
| `playlist-design-decisions.md` | Shared Level 3 playlist scope and acceptance criteria; duplicate-feedback UX remains open for the RPI plan gate. |
| `music-catalog-playlist-slice-brd.md` | Example business requirements to review against the intended listener need. |
| `music-catalog-playlist-slice.md` | Concrete PRD reference for requirements review and later Functional Planner intake. |
| `dt-later-slice.md` | Proposed mood-filter follow-up for Level 5, not a decision made by this student or an implemented feature. |

The commands stop if download or extraction fails; ask the tutor for help rather than treating a failed download as a usable solution. Extraction uses a fresh temporary folder, and `-n` does not overwrite existing extracted files. No repository file changes. The filter excludes the bundled `.github/copilot-instructions.md` and preselected Level 3 ADR; do not install those to accelerate Level 2.

### Review and rejoin the workshop

With the tutor, compare the supplied scope with the student's saved decisions. Merge only the needed, reviewed documents into `docs/project-planning/` using the editor; do not replace existing work blindly. Keep the fixed Level 3 playlist contract unchanged, and retain the student's actual later-slice choice. If the mood-filter reference is used instead, explicitly record it as a tutor-supplied fallback, not an authentic DT outcome.

**Approval still belongs to the student and qualified reviewer.** The archive's `approved` status, versions, named roles, sign-off records, and waivers belong to its originating example. Do not inherit those approvals or claim validated listener outcomes. Review and adapt the imported requirements, resolve conflicting scope and outstanding gates, and record the current review before treating them as signed-off input.

Return to Level 2's common implementation handoff and curation. Commit only reviewed deliverables through the normal path-selection and staged-diff gates; never commit raw working state or the downloaded ZIP. Students can then continue to Level 3 from the reviewed delivery brief. If they use Functional Planner first, supply the actual reviewed PRD path and confirm the intended project and repository. The bundle contains no Functional Planner handoff or live issues: planning stays read-only, and creation still requires reviewing the newly returned handoff and separately authorizing GitHub writes.

Success Criteria:
- Needed planning documents have been inspected and reconciled with the student's context, without overwriting unrelated files.
- The current review and any remaining gaps are explicit; imported labels are not treated as fresh approval.
- The shared playlist scope and later-slice provenance remain distinct, with the actual paths available for continuation.

## Other role-track reference outputs

<div class="warning" data-title="Workshop simulation">

> These documents were written by hand to match the fixed scope of the workshop. They are not captured agent output. Real BRD Builder, PRD Builder, Functional Planner, ADR Creator, and Security Reviewer runs produce different wording, file names, identifiers, and structure. Compare the content and scope, not the exact text.

</div>

| File | Track | Produced in a real run by | Where attendees save it |
| --- | --- | --- | --- |
| [project-planning/remove-playlist-track.md](project-planning/remove-playlist-track.md) | Level 5, core follow-up | Workshop-authored planning decision, not captured agent output | `docs\project-planning`, linked from the feature issue |
| [planning/adrs/0001-in-memory-playlist-state.md](planning/adrs/0001-in-memory-playlist-state.md) | Level 3, Tech Lead extension | ADR Creator | `docs\planning\adrs` |
| [security/playlist-security-review.md](security/playlist-security-review.md) | Level 5, Security Architect track | Security Reviewer, run by Copilot cloud agent | `docs\security`, through the agent's pull request |

How to use them:

- **Tech Lead extension.** Compare the attendee ADR with the sample: it needs context, the chosen option, the options it rejected, and the consequences (state lost on restart, single instance only, replaced by a later persistence change).
- **Security Architect track.** Use the sample report to show the expected shape: severity, file and line, description, recommendation, a verified or unverified status, the skills applied, and the AI-assisted disclaimer. The report has illustrative findings. Do not treat it as a real assessment of any implementation.
