# Maintainer handbook

This handbook gives a new maintainer enough context to pick up the workshop without the original authoring notes. It records why the workshop is shaped the way it is, what was verified and how, what is still open, and how to continue the work.

For writing rules, upstream pins and validation commands, see [CONTRIBUTING.md](../CONTRIBUTING.md). For timing and the facilitator's messaging guardrails, see [tutor.md](tutor.md).

## When to use this handbook

- You are taking over maintenance or preparing a new delivery.
- You want to change the scope, order or tooling of a workshop and need to know which decisions it would reopen.
- You are about to re-verify the workshop against new releases of Copilot, Copilot CLI, APM, HVE-Core or GitHub agentic workflows.

## Workshop intent

The workshop runs over two 4-hour workshop sessions for a technical audience. Each workshop builds on the previous one, so the progression is the main design constraint.

| Workshop | Focus | Source |
| --- | --- | --- |
| 1. GitHub Copilot Zero to Hero | Copilot primitives: completions, chat, instructions, prompts, agents, skills, MCP, hooks | Wraps [Philess/GHCopilotHoL](https://github.com/Philess/GHCopilotHoL) and adds Levels 7 to 9 plus an advanced Deeper primitives page |
| 2. AI SDLC with Github Copilot and HVE Core | HVE principles, Design Thinking, RPI, APM and plugin marketplace, agentic workflows, Copilot cloud agent delegation | Original content in this repository |

The [README crescendo](../README.md#the-crescendo) explains the order to attendees. Read it before you reorder modules.

## Design decisions

These decisions shape the content. Changing one usually affects several modules, the solutions and the workshop tester. The problem, scope, stakeholders and assumptions behind them are in the [design documentation](design/README.md).

| # | Decision | Why |
| --- | --- | --- |
| D1 | Two 4-hour workshop sessions | Fits a customer's half-day slots and separates individual use (GitHub Copilot Zero to Hero) from team and SDLC use (the AI SDLC workshop). |
| D2 | GitHub Copilot Zero to Hero follows GHCopilotHoL | Reuses a maintained lab instead of forking it. Upstream commits are pinned in [CONTRIBUTING.md](../CONTRIBUTING.md#upstream-pins). |
| D3 | AI SDLC with Github Copilot and HVE Core runs in three acts: build the feature (HVE principles → Design Thinking → RPI), scale the method (APM, policy and plugin marketplace → agentic workflows), then close the loop (delegation to Copilot cloud agent and review) | Each step reuses the output of the previous one. The README crescendo and the "Why this level" lines say what each level adds and why the previous one was not enough. |
| D4 | Hands-on first, demos as fallback | Attendees keep working assets. The tutor guide lists the demo fallbacks. |
| D5 | Environment setup happens before the day | Setup failures should not consume workshop time. See [prerequisites.md](prerequisites.md) and the `before-d-day-*.md` checklists. |
| D6 | One application for all of the AI SDLC workshop: the Music Catalog (`src/front` React 19 + TypeScript + Vite, `src/api` .NET 10 minimal API) | One shared context keeps prompts, reviews and workflows comparable across the room. |
| D7 | Attendees start from a hello-world starter | Keeps the slice small enough to finish. |
| D8 | One feature: browse tracks and add a track to a playlist | Small enough for a learning loop, rich enough to exercise evidence, a design decision, and acceptance review. |
| D9 | Exactly one in-memory playlist: no persistence, no users, no playlist creation or reordering | Avoids databases and authentication, which add setup without teaching the method. |
| D10 | Duplicate-feedback UX remains a real decision. The planner explores approaches; the duplicate-rejection contract and empty-state text stay fixed | Attendees judge trade-offs at the plan gate and debrief contrasting choices. Do not preselect the agent's alternatives or require identical implementation details. |
| D11 | Use HVE's native instructions, skills, and handoffs with short, source-linked requests. DT is a learner-led sampler; BRD/PRD derive from reviewed inputs; RPI consumes the preceding artifacts | Supply facts, scope, and decisions rather than outlines or coding recipes. Save the delivery brief before PRD Builder. The tester replays curated contributions without treating them as human research or approval. |
| D12 | Design Thinking plus RPI takes under 2 hours, including the context engineering segment and the decision debrief | Leaves time for APM, workflows, delegation and the architect capstone. |
| D13 | HVE-Core is installed through APM inside the application repository | Copilot cloud agent and agentic workflows only see what is in the repository, so a local plugin is not enough. |
| D14–D15 | Agentic workflows: daily backlog management, accessibility review, and security-review delegation | Shows recurring automation that feeds issues back to people and agents. |
| D16 | Level 5 reconciles opted-in issues with committed planning and linked delivery evidence, then delegates a bounded RPI issue to Copilot cloud agent. Level 6 explicitly requests Copilot review and verifies issue/Project progress | See the [Level 4-6 learning-flow decisions](project-planning/levels-4-6-learning-flow.md). No invented findings, automatic assignment, or closure from merge alone. |
| D18 | Verification as contract: required `test` and `apm-audit` checks are added before delegation, and `copilot-setup-steps.yml` is extended with a build step | Level 4 copies the audit-only `apm-audit.yml`; Level 5 enables its no-bypass ruleset after setup pushes. The agent's pull request is judged by the same checks as a human's. Solutions: `solutions/afternoon-2/.github/workflows/{ci,apm-audit}.yml` and `solutions/afternoon-2/rulesets/{main-tests-required,main-apm-audit-required}.json`. |
| D19 | GitHub Copilot Zero to Hero fast track for advanced audiences: upstream Levels 1 to 4 become pre-work or a demo, and the time goes to the Deeper primitives page (instruction layering, a guardrail hook, MCP governance) | Advanced developers and architects need layering and limits, not another pass on completions. Timing is in [tutor.md](tutor.md). |
| D20 | AI SDLC with Github Copilot and HVE Core ends with an architect capstone: org rollout, measuring impact, brownfield adoption, choosing a method, and a model decision guide | Architects leave with the decisions they must take to scale the method. Model and usage guidance lives here, without prices. |
| D21 | Progressive disclosure: short level introductions, optional deeper explanations, and a visible hands-on path | The [Workshop Authoring skill](../.github/skills/workshop-authoring/SKILL.md) owns the rule and Workshop Creator loads it before content work. Required prompts, prerequisites, warnings, success criteria, and human gates are not hidden. |
| D17 | Reference for agentic workflow layout: [CoffeesoftDotDev/accessibility-copilot](https://github.com/CoffeesoftDotDev/accessibility-copilot) | A working `.md` plus compiled `.lock.yml` example. It also showed that workflows can open repeated failure issues, so the solutions limit and deduplicate their outputs. |

Later additions follow the same pattern:

- **Role tracks.** These are the product manager, developer (RPI) and security tracks, based on the [HVE-Core role guides](https://microsoft.github.io/hve-core/docs/hve-guide/roles/tpm).
- **Levels 4-6.** APM is the participant installation exercise; private marketplace and accessibility examples are separate proctor demos. Level 6 independently reviews the cloud agent's RPI PR. The old marketplace test-writer exercise is no longer on the core path.
- **Threat model sidebars.** Levels 5 and 6 each list the agentic risks (prompt injection, safe outputs, firewall, token scope) and the control that answers each one.
- **RPI Agent.** A section explains that RPI Agent runs the `/rpi-*` phases.
- **Workshop Creator agent.** Defined in `.github/agents/workshop-creator.agent.md`, it reproduces this repository's creation path for a new workshop.

## Scope limits

Keep these out of the attendee path unless the design decisions above change:

- No database, file writes or external services in the Music Catalog. State stays in memory.
- No additional front-end state-management or UI libraries.
- Cost and Auto model selection appear only as a short decision guide in the architect capstone. HydraFusion stays in Extra Credits as a Research Preview. No prices or quotas appear anywhere.
- No real customer or personal data. Use synthetic data only.

## Verified facts and how they were checked

Re-check these whenever you bump a version. The dates and versions are from the original verification.

| Fact | How it was checked |
| --- | --- |
| `apm install microsoft/hve-core --target copilot` works; without `--target`, an empty repository fails with "No harness detected" | Run live with APM 0.32.0 on Windows |
| HVE-Core cannot be pinned by release tag (`#hve-core-v3.2.2` fails with "no apm.yml found"); pinning by commit SHA works | Run live. The pin is the v3.2.2 commit `1dbd6a7`, recorded in `solutions/afternoon-2/apm.yml` |
| `apm audit --ci` fails without `apm.lock.yaml`; it passes with the lockfile and the sample policy | Run live. Upstream labels `--policy` experimental, but policy auditing requires no experimental-feature activation |
| RPI commands `/rpi`, `/rpi-research`, `/rpi-plan`, `/rpi-implement` and `/rpi-review` exist. The phase commands are skills that also run without RPI Agent. RPI Agent asks for a working mode only when the request does not set one | Read against the installed HVE-Core 3.2.2 plugin files |
| Agentic workflows use `engine: copilot`, safe outputs, and compiled `.lock.yml` files generated by `gh aw compile`, never written by hand | Read in the [gh-aw documentation](https://github.github.com/gh-aw/) |

When a fact cannot be confirmed in official documentation, label it as preview, experimental or unverified in the guide rather than presenting it as settled.

## Open assumptions and risks

| Item | Status | Impact |
| --- | --- | --- |
| Customer licences cover Copilot CLI, Copilot cloud agent and agentic workflows | Unverified per customer. Check on the [kick-off call](kick-off-call-checklist.md) | High |
| The customer organization allows plugin marketplaces, APM sources and the required network hosts | Unverified per customer. See [prerequisites.md](prerequisites.md) | High |
| Design Thinking plus RPI fits in 2 hours with native HVE guidance and short task requests | Not yet measured in a dry run | High |
| Attendees can create the branch ruleset with `gh api` | Needs the admin role on the repository, and a plan that supports rulesets on private repositories. The bypass actor uses the repository admin role (`actor_id` 5); not tested live | Medium |
| The delegated pull request is ready by Level 6 | Depends on the agent run time; not measured in a dry run | Medium |
| Shared acceptance criteria give comparable outcomes despite different agent questions and design choices | Assumed; live delivery not measured | Medium |
| The three solution workflows (`daily-backlog.md`, `a11y-review.md`, `security-review-delegation.md`) compile and run in a real repository | Not compiled in this repository. Run `gh aw compile` in a test repository before delivery | Medium |
| Private marketplace and accessibility demos are available to attendees | Attendee access is not required; proctor uses the supplied captures and prepared output | Low |

## Current status

### Independent pedagogy review on PR creation

The repository custom agent [Workshop Pedagogy Reviewer](../.github/agents/workshop-pedagogy-reviewer.agent.md) critiques content, narrative flow, presentation, and the short concept primer at the beginning of each level. It reads the target repository's existing issues and linked PR evidence to distinguish tracked, partially addressed, new, and uncertain findings. It does not execute the lab, change files, or mutate the backlog itself. It complements the execution tester; neither a green test run nor an editorial assessment proves learner comprehension.

The [pedagogy review agentic workflow](../.github/workflows/workshop-pedagogy-review.md) runs automatically when a pull request is **opened** with changes matching **`**/workshop.md`**. It imports the reviewer instructions, supplies the opening PR's head SHA, and asks for a review of `workshop.md` content and their supporting documentation at that revision, without prescribing guide paths or a guide count. PRs without matching changes do not trigger it. There is no enable variable, tester dependency, manual trigger, or rerun on later PR updates.

Setup:

1. Create the repository label **`pedagogy-review`** in GitHub's Issues > Labels before the first run. The publisher does not create or edit labels.
2. Allow the agent job's repository-scoped `GITHUB_TOKEN` to make **Copilot requests** through the organization's policy. The agent has **Contents, Issues, and Pull requests read access**; the separate safe-output job receives **Issues write access** for report publication. No tester token or `WORKSHOP_PEDAGOGY_TOKEN` is required or reused, and no secret is created automatically.
3. Compile changes with `gh aw compile workshop-pedagogy-review --strict --validate --no-check-update` and keep the Markdown source, generated lock, and action pins together. gh-aw provides the default Copilot runtime and sandbox; the application-building `copilot-setup-steps.yml` is not needed for document review.

The frontmatter declares **when to run**, **which reviewer to use**, **read-only access**, and **the report output**. The short Markdown body describes the task. gh-aw handles runtime setup and safe publication; there are no custom preparation scripts, prefetched inventories, model pins, or report-validation steps. GitHub toolsets are limited to **`repos` and `issues`**; dedicated PR tools are not exposed, so unavailable linked-PR details must be reported as evidence gaps. The reviewer is instructed to read files at the supplied SHA, using GitHub reads if the local checkout differs, and to treat document and issue content as evidence rather than executable instructions.

The agent requests one six-section, all-level report through `create-issue`, including a clean assessment when no findings are supported. Reports use the `pedagogy-review` label and a `[Pedagogy review] PR <number> (<head SHA>)` title. Exact-title deduplication plus an all-state search avoid duplicate reports; existing reports are not edited, closed, or assigned. A duplicate report or closed PR yields `noop`; missing material or tools that prevent review yield `report_incomplete`. Report completeness is guided by the reviewer instructions, **not enforced by a custom validation script**.

Standard gh-aw collaborator and same-repository guards remain; fork PRs are excluded. PRs created by a workflow's `GITHUB_TOKEN` do not trigger another Actions workflow. Inspect run diagnostics and agent-output artifacts for failures; do not treat a missing issue as a clean review. Live inference, publication permissions, and learner comprehension still require a maintainer dry run.

There is no manual Actions trigger. For an interactive review, select **Workshop Pedagogy Reviewer** in Copilot Chat or ask a pedagogy question so it can be selected automatically; `disable-model-invocation` is not set. Local CLI use remains `copilot --agent workshop-pedagogy-reviewer --model auto --auto-tier intelligence`: explicitly name the GitHub repository and request a review of `workshop.md` content and their supporting documentation plus current issue context. Your login must have repository read access. Interactive use returns the report in the conversation and never publishes it. Broader issue changes remain a separate reviewed backlog-execution workflow.

Run the local regression checks with `node --test tests/workshop/pedagogy/review.test.mjs`.

- **Guides.** Both guides keep `published: false` until a dry run is complete.
- **Kick-off deck.** `docs/kick-off.pptx` is current on `main`.
- **Open work.** [#26](https://github.com/Justrebl/AI-SDLC-Workshop/pull/26) adds Codespace security guardrails to the workshop tester.
  - Its source changes are complete and checked statically.
  - The live runs need a `WORKSHOP_TESTER_SANDBOX_TOKEN` repository secret: a fine-grained token with Contents, Issues, Pull requests, Actions and Workflows read and write, and Metadata read.
  - Run once with the egress lock off and once with `WORKSHOP_TESTER_EGRESS_LOCK=1`.
- **Organization settings.** An organization admin still needs to apply the Codespaces and Copilot budget settings described in [#26](https://github.com/Justrebl/AI-SDLC-Workshop/pull/26) before the tester runs unattended.

## Resume the work

### Prerequisites

- Copilot CLI or VS Code with the [HVE-Core plugin](https://microsoft.github.io/hve-core/) installed.
- `gh` with the `gh aw` extension, and `apm`.
- .NET 10 SDK and Node.js for the starter application.

### Step 1: Start from `main` on a feature branch

Use one branch and one pull request per feature. Run `git switch -c feature/<topic> origin/main`.

### Step 2: Run the change through RPI

Type `/rpi`, select the HVE-Core prompt, and press **Tab**. Add the task before sending the whole message, or run the phases yourself. For example:

```text
/hve-core:rpi.prompt

Re-verify Level 4 against the latest APM release and update the guide and solutions.
```

During Research, give the agent this handbook, the [design documentation](design/README.md), [CONTRIBUTING.md](../CONTRIBUTING.md) and [tutor.md](tutor.md#messaging-guardrails) so it inherits the decisions, writing rules and guardrails. Expect the agent to verify commands against official documentation before it changes a guide.

### Step 3: Validate and open the pull request

Run the checks in [CONTRIBUTING.md](../CONTRIBUTING.md#validation) that apply to your change, then open a pull request with a conventional commit prefix. Preview the guide on MOAW from your branch.

### Step 4: Merge stacked pull requests

If several pull requests are stacked on each other, merge them with the asynchronous merge API on the top pull request. This merges every open pull request below it:

```bash
gh api -X PUT repos/Justrebl/AI-SDLC-Workshop/pulls/<top-pr>/merge-async -f merge_method=merge
```

`gh pr merge` returns an error for pull requests that are part of a stack.

## Expected outcome

The change is on `main`, the attendee guides stay free of maintainer-only content, and the [workshop tester](../tests/workshop/afternoon-2/README.md) replays the AI SDLC workshop without opening a failure issue.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `gh aw compile` hangs | Add `--no-check-update` |
| `apm install` fails with "No harness detected" | Pass `--target copilot` |
| APM rejects the HVE-Core pin | Pin a commit SHA, not a release tag |
| Starter readiness reports a dirty working tree | Use a fresh template copy or the documented copy fallback; prerequisite checks do not create an extra baseline commit |
