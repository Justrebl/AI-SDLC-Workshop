import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const workflow = read('../../../solutions/afternoon-2/.github/workflows/apm-audit.yml');
const ruleset = JSON.parse(read('../../../solutions/afternoon-2/rulesets/main-apm-audit-required.json'));
const workshop = read('../../../docs/afternoon-2/workshop.md');
const runner = read('./run-lab.sh');
const level4 = workshop.slice(workshop.indexOf('# Level 4:'), workshop.indexOf('# Level 5:'));
const level5 = workshop.slice(workshop.indexOf('# Level 5:'), workshop.indexOf('# Level 6:'));
const optional = workshop.slice(workshop.indexOf('# Optional Level 7:'), workshop.indexOf('# Recap:'));
const auditCommand = workflow.match(/^\s+run: (apm audit[^\n]+)$/m)?.[1];
const bash = process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash';

test('the solution runs an unfiltered, read-only PR audit without rewriting committed context', () => {
  assert.match(workflow, /^on:\n  pull_request:\n  push:\n    branches: \[main\]\n  merge_group:\n  workflow_dispatch:/m);
  assert.match(workflow, /^permissions:\n  contents: read$/m);
  assert.match(workflow, /uses: actions\/checkout@v5\n\s+with:\n\s+persist-credentials: false/);
  assert.match(workflow, /uses: microsoft\/apm-action@v1\n\s+with:\n\s+apm-version: "0\.33\.0"\n\s+setup-only: true/);
  assert.equal(auditCommand, 'apm audit --ci --no-cache --policy apm-policy.yml');
  assert.doesNotMatch(workflow, /pull_request_target|paths:|continue-on-error:|^\s+if:|apm install|--no-drift|--no-policy|secrets\./m);
  assert.equal(existsSync(new URL('../../../.github/workflows/apm-audit.yml', import.meta.url)), false);
});

test('the active default-branch rule requires the exact audit job with no administrator bypass', () => {
  const jobName = workflow.match(/^    name: (.+)$/m)?.[1];
  assert.equal(jobName, 'apm-audit');
  assert.equal(ruleset.target, 'branch');
  assert.equal(ruleset.enforcement, 'active');
  assert.deepEqual(ruleset.conditions.ref_name, { include: ['~DEFAULT_BRANCH'], exclude: [] });
  assert.deepEqual(ruleset.bypass_actors, []);
  const required = ruleset.rules.find((rule) => rule.type === 'required_status_checks');
  assert.deepEqual(required.parameters.required_status_checks, [{ context: jobName }]);
  assert.match(optional, /wait for \*\*APM Audit\*\* on its latest commit to pass/);
  assert.match(optional, /no bypass list/);
  assert.match(optional, /A failed or missing `apm-audit` blocks merging/);
  assert.match(optional, /later workflow and planning changes must use a reviewed pull request/);
  assert.match(level5, /Wait for the required `test` check/);
  assert.doesNotMatch(level5, /apm-audit|main-apm-audit-required/);
  assert.match(level5, /A human reviews and merges\s+the PR through the normal workflow/);
  assert.match(level5, /administration permission and a supported GitHub plan/);
  const security = level5.slice(level5.indexOf('### Step 5 (facilitator demo)'));
  assert.match(security, /to security-review-delegation/);
  assert.match(security, /\/hve-core:pull-request[\s\S]*?ask for\npublication approval/);
  assert.match(security, /Open the returned pull request, wait for the required checks, and have a human review and merge/);
});

test('optional Level 7 preserves the workflow and shared-skill publication contract', () => {
  const copyStep = optional.slice(optional.indexOf('### Step 1: Add the PR audit workflow'),
    optional.indexOf('### Step 2: Commit and push'));
  assert.match(copyStep, /```bash\nmkdir -p \.github\/workflows\ncp solutions\/afternoon-2\/\.github\/workflows\/apm-audit\.yml \.github\/workflows\/apm-audit\.yml\n```/);
  assert.match(copyStep, /without reinstalling your packages/);
  assert.match(copyStep, /A workflow alone does not block merging/);
  assert.match(optional, /Commit the governed repository setup: apm\.yml, apm\.lock\.yaml, apm-policy\.yml/);
  assert.match(optional, /reviewed deployed files under \.github\/ and \.agents\//);
  assert.doesNotMatch(level4, /Step 5: Discuss CI|does not require authoring a new CI workflow/);
});

test('the core replay does not install or require the optional APM audit', () => {
  assert.match(runner, /skip_step l7-apm/);
  assert.doesNotMatch(runner, /step l[45]-[^\n]*apm|git add apm\.yml|apm install --target/);
  assert.match(runner, /skip_step l5-cloud-profiles/);
  assert.ok(runner.indexOf('step l5-setup-steps') < runner.indexOf('skip_step l5-cloud-profiles'));
  assert.ok(runner.indexOf('skip_step l5-cloud-profiles') < runner.indexOf('skip_step l5-prereqs'));
});

for (const status of [0, 1]) {
  test(`the published audit command preserves exit status ${status}`, () => {
    assert.ok(auditCommand);
    const result = spawnSync(bash, ['-c', `
apm() {
  [ "$*" = "audit --ci --no-cache --policy apm-policy.yml" ] || return 99
  return "$AUDIT_FIXTURE_STATUS"
}
${auditCommand}
`], { encoding: 'utf8', env: { ...process.env, AUDIT_FIXTURE_STATUS: String(status) } });
    assert.equal(result.status, status, result.stderr || String(result.error || ''));
  });
}
