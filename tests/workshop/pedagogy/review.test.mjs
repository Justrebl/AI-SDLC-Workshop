import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { posix } from 'node:path';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const workflow = read('../../../.github/workflows/workshop-pedagogy-review.md');
const frontmatter = workflow.split('---')[1];
const agent = read('../../../.github/agents/workshop-pedagogy-reviewer.agent.md');
const lock = read('../../../.github/workflows/workshop-pedagogy-review.lock.yml');
const job = name => {
  const match = lock.match(new RegExp(`\\n  ${name}:\\n([\\s\\S]*?)(?=\\n  [a-z][a-z0-9_-]*:\\n|$)`));
  assert.ok(match, `Missing generated job: ${name}`);
  return match[1];
};

test('lean workflow automatically reviews opened PRs with workshop.md changes only', () => {
  assert.match(frontmatter, /on:\n  pull_request:\n    types: \[opened\]\n    paths: \["\*\*\/workshop\.md"\]\n/);
  assert.doesNotMatch(frontmatter, /workflow_run:|workflow_dispatch:|schedule:|push:|WORKSHOP_TESTER|WORKSHOP_PEDAGOGY_REVIEW_ENABLED|^if:/m);
  assert.doesNotMatch(frontmatter, /^(engine|env|steps|jobs|checkout):/m);
  assert.doesNotMatch(workflow, /review-input\.json|review\.mjs|\/tmp\/gh-aw\/agent\/pedagogy|setup-copilot/);
  assert.equal(existsSync(new URL('./review.mjs', import.meta.url)), false);
});

test('workshop path filter includes guide changes and excludes unrelated files', () => {
  const pattern = frontmatter.match(/paths: \["([^"]+)"\]/)[1];
  for (const [path, expected] of [
    ['workshop.md', true],
    ['docs/afternoon-1/workshop.md', true],
    ['docs/afternoon-2/workshop.md', true],
    ['docs/nested/example/workshop.md', true],
    ['README.md', false],
    ['docs/maintainer-handbook.md', false],
    ['docs/afternoon-2/workshop.md.bak', false],
    ['src/front/src/App.tsx', false],
  ]) assert.equal(posix.matchesGlob(path, pattern), expected, path);
});

test('workflow imports the reviewer and declares read-only access with bounded report output', () => {
  assert.match(frontmatter, /imports:\n  - \.github\/agents\/workshop-pedagogy-reviewer\.agent\.md/);
  assert.match(frontmatter, /contents: read\n  issues: read\n  pull-requests: read\n  copilot-requests: write/);
  assert.doesNotMatch(frontmatter, /contents: write|issues: write|pull-requests: write/);
  assert.match(frontmatter, /toolsets: \[repos, issues\]/);
  assert.match(frontmatter, /bash: \["safeoutputs"\]\n  edit: false/);
  assert.match(frontmatter, /create-issue:\n    title-prefix: "\[Pedagogy review\] "\n    labels: \[pedagogy-review\]\n    max: 1\n    deduplicate-by-title: true/);
  assert.doesNotMatch(frontmatter, /update-issue:|close-issue:|assign-to|close-older-issues:|steps:/);
  assert.match(workflow, /github\.event\.pull_request\.head\.sha/);
  assert.match(workflow, /six-section report contract/);
  assert.match(workflow, /to review `workshop\.md` content\s+and their supporting documentation\./);
  assert.doesNotMatch(workflow, /docs\/afternoon-[12]\/workshop\.md/);
  assert.match(workflow, /Call `noop` if the report already exists or the PR is closed/);
  assert.match(workflow, /call `report_incomplete`/);
});

test('compiled workflow preserves the trigger, reviewer import and read-only publication boundary', () => {
  const metadata = JSON.parse(lock.match(/^# gh-aw-metadata: (.+)$/m)[1]);
  assert.equal(metadata.strict, true);
  const manifest = JSON.parse(lock.match(/^# gh-aw-manifest: (.+)$/m)[1]);
  const githubTools = manifest.mcp_servers.find(server => server.name === 'github').tools;
  assert.ok(githubTools.includes('get_file_contents'));
  assert.ok(githubTools.includes('issue_read'));
  assert.ok(githubTools.every(tool => !/^(get_pull_request|list_pull_requests|pull_request_read|search_pull_requests)/.test(tool)));
  const trigger = lock.match(/^on:\n([\s\S]*?)(?=\n\S)/m)[1];
  assert.match(trigger, /^  pull_request:\n/);
  assert.match(trigger, /    types:\n      - opened\n/);
  assert.match(trigger, /    paths:\n      - ["']\*\*\/workshop\.md["']/);
  assert.doesNotMatch(lock, /WORKSHOP_PEDAGOGY_REVIEW_ENABLED|review\.mjs|Check report contract before publication|Prepare isolated review material/);
  assert.doesNotMatch(lock, /docs\/afternoon-[12]\/workshop\.md/);
  assert.match(lock, /head\.repo\.id == github\.repository_id/);
  assert.match(lock, /runtime-import \.github\/agents\/workshop-pedagogy-reviewer\.agent\.md/);
  const agentJob = job('agent');
  assert.match(agentJob, /contents: read/);
  assert.match(agentJob, /issues: read/);
  assert.match(agentJob, /pull-requests: read/);
  assert.doesNotMatch(agentJob, /contents: write|issues: write|pull-requests: write|--allow-tool edit/);
  assert.match(job('safe_outputs'), /issues: write/);
});

test('reviewer stays available to Chat and no longer requires custom pipeline inputs', () => {
  assert.doesNotMatch(agent.split('---')[1], /disable-model-invocation/);
  assert.match(agent, /description: "Answer workshop pedagogy questions/);
  assert.match(agent, /tools:\n  - read\n  - search/);
  assert.doesNotMatch(agent, /review-input\.json|automated gh-aw caller selects Auto/);
  assert.match(agent, /Review `workshop\.md` content and their supporting documentation/);
  assert.doesNotMatch(agent, /both workshops|both local workshop guides|both attendee guides|two-workshop format|docs\/afternoon-[12]\/workshop\.md/);
  assert.doesNotMatch(agent.split('---')[1], /github.*\/(?:issue_write|create|assign|merge)/);
  for (const heading of [
    'Scope and evidence', 'Overall assessment', 'Level-by-level coverage', 'Prioritized findings',
    'Detailed conclusion and improvement plan', 'Limitations and human follow-up',
  ]) assert.ok(agent.includes(`## ${heading}\n`), heading);
});
