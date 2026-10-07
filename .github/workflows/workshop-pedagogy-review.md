---
name: Workshop pedagogy review
description: "Review workshop learning flow when a PR with workshop.md changes is opened."
intent: "Help maintainers identify evidence-backed improvements to the workshop learning experience."

on:
  pull_request:
    types: [opened]
    paths: ["**/workshop.md"]

permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write

imports:
  - .github/agents/workshop-pedagogy-reviewer.agent.md

network: defaults

tools:
  github:
    toolsets: [repos, issues]
  bash: ["safeoutputs"]
  edit: false

safe-outputs:
  mentions: false
  allowed-github-references: []
  create-issue:
    title-prefix: "[Pedagogy review] "
    labels: [pedagogy-review]
    max: 1
    deduplicate-by-title: true
---

# Workshop pedagogy review

Use the imported Workshop Pedagogy Reviewer to review `workshop.md` content
and their supporting documentation.
The repository is `${{ github.repository }}` and the reviewed revision is the
opening PR's head SHA: `${{ github.event.pull_request.head.sha }}`.
Read files at that revision; use GitHub file reads with that SHA if the local checkout differs.
Scope all issue and PR reads to this repository. Do not execute workshop commands or modify files.

Follow the reviewer's method and six-section report contract, covering every core level
and distinguishing existing tracked findings from new ones. State missing evidence explicitly.
If the available tools cannot expose linked PR details, report that evidence gap rather than infer them.

Publish one report using `create_issue` with title
`PR ${{ github.event.pull_request.number }} (${{ github.event.pull_request.head.sha }})`.
Include the reviewed SHA and PR URL
`${{ github.server_url }}/${{ github.repository }}/pull/${{ github.event.pull_request.number }}` in its body.
Before publishing, check all issue states for that title with the `[Pedagogy review] ` prefix.
Call `noop` if the report already exists or the PR is closed. Otherwise publish the
complete editorial assessment, even if there are no supported findings.
If required material or tools prevent a meaningful review, call `report_incomplete`.
Use only the framework's safe-output transport for publication; never mutate GitHub directly.
