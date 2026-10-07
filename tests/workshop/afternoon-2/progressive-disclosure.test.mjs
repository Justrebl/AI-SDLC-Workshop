import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withoutDetails } from './guide-markup.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = (path) => readFileSync(resolve(root, path), 'utf8').replace(/\r\n/g, '\n');
const workshop = read('docs/afternoon-2/workshop.md');
const creator = read('.github/agents/workshop-creator.agent.md');
const skill = read('.github/skills/workshop-authoring/SKILL.md');
const frontmatter = (text) => text.match(/^---\n([\s\S]*?)\n---\n/)?.[1];

test('checkpoint labels consistently use Success Criteria across both workshops and authoring guidance', () => {
  const obsolete = new RegExp(['expected', 'results?'].join(' '), 'i');
  for (const path of [
    'docs/afternoon-1/workshop.md',
    'docs/afternoon-2/workshop.md',
    '.github/agents/workshop-creator.agent.md',
    '.github/agents/workshop-pedagogy-reviewer.agent.md',
    '.github/skills/workshop-authoring/SKILL.md',
    '.github/workflows/workshop-tester.md',
    'docs/maintainer-handbook.md',
  ]) assert.doesNotMatch(read(path), obsolete, path);
  for (const path of ['docs/afternoon-1/workshop.md', 'docs/afternoon-2/workshop.md']) {
    assert.match(read(path), /^Success Criteria:$/m, path);
  }
});

test('each level has a concise visible introduction and optional background', () => {
  const actionHeadings = [
    '## Install the CLI plugin',
    '## Start a DT project',
    '## Research phase',
    '## Install HVE-Core through APM',
    '## Install and initialize gh-aw',
    '## Review the pull request',
  ];
  actionHeadings.forEach((heading, index) => {
    const start = workshop.indexOf(`# Level ${index + 1}:`);
    const action = workshop.indexOf(heading, start);
    assert.ok(start >= 0 && action > start, `Level ${index + 1} action`);
    const introduction = workshop.slice(start, action);
    assert.match(introduction, /<details>\n<summary>[^<]+<\/summary>/);
    const visible = withoutDetails(introduction);
    assert.match(visible, /## Topic/);
    const optionalLecture = index === 4
      ? visible.replace(/### Handoff artifact: Stage 5a verification record[\s\S]*?(?=\n## Stage 5b: Backlog and delegation)/, '')
      : visible;
    assert.doesNotMatch(optionalLecture, /^\|/m, `Level ${index + 1} lecture tables stay optional`);
    assert.doesNotMatch(introduction, /<details\s+open/);
  });
});

test('disclosure markup is balanced and contains no page or level boundary', () => {
  let depth = 0;
  let fence;
  for (const line of workshop.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = undefined;
      continue;
    }
    if (fence) continue;
    if (line.includes('<details>')) depth++;
    if (line.includes('</details>')) depth--;
    assert.ok(depth >= 0, 'no unmatched closing detail tag');
    if (/^---\s*$|^# /.test(line)) assert.equal(depth, 0, 'page boundaries remain outside details');
  }
  assert.equal(depth, 0);
  assert.equal(fence, undefined);
});

test('published A2 images have actual assets instead of missing-image placeholders', () => {
  let checked = 0;
  for (const document of ['docs/afternoon-2/workshop.md', 'docs/tutor.md']) {
    const text = read(document);
    const targets = [
      ...[...text.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(match => match[1]),
      ...[...text.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match => match[1]),
    ];
    for (const target of targets) {
      if (/^(?:https?:|data:)/i.test(target)) continue;
      const asset = resolve(dirname(resolve(root, document)), decodeURIComponent(target.split(/[?#]/)[0]));
      assert.ok(existsSync(asset), `${document}: ${target}`);
      assert.ok(statSync(asset).isFile(), `${document}: ${target} is an image file`);
      checked++;
    }
  }
  assert.ok(checked > 0, 'existing supplied images remain');
  assert.match(read('docs/afternoon-2/assets/README.md'), /their embeds are omitted from the workshop/);
});

test('conditional setup help is collapsed while primary commands and safety gates remain visible', () => {
  const blocks = [...workshop.matchAll(/<details>\n<summary>🪛 setup\/troubleshoot: ([^<]+)<\/summary>([\s\S]*?)<\/details>/g)];
  assert.ok(blocks.length >= 10);
  const help = blocks.map(match => match[2]).join('\n');
  for (const text of [
    'If your instructions refer to `/agents`', 'If DT Coach is missing',
    'If GitHub write tools are missing',
    'With a classic OAuth credential', 'If a command is missing',
  ]) assert.ok(help.includes(text), text);
  const visible = withoutDetails(workshop);
  for (const text of [
    '/agent dt-coach', 'copilot model --global auto intelligence',
    'Confirm that DT Coach is the active agent',
    'Never paste credentials into chat or repository files',
    'If required GitHub write tools are unavailable, stop',
    'Success Criteria:',
  ]) assert.ok(visible.includes(text), text);
  assert.doesNotMatch(visible, /If your instructions refer to `\/agents`/);
});

test('required exercise commands and approval gates remain visible and facilitator demo keeps safety warnings', () => {
  const visible = withoutDetails(workshop);
  for (const text of [
    '## Install the CLI plugin', '## Start a DT project', '## Research phase',
    '## Plan phase', '## Implement phase', '## Review phase',
    'apm install', 'apm audit --ci', 'gh aw compile',
    '## Stage 5a: Verification as contract', '## Stage 5b: Backlog and delegation',
    '### Step 2: Assign the issue', '### Step 6: Decide',
    '### Facilitator demo: Secret scanning and push protection',
    'This is facilitator-only; attendees do not configure push protection in their repositories.', 'Never',
    'explicitly approve the plan in the conversation', 'A skipped or blocked run is not a pass',
  ]) assert.ok(visible.includes(text), text);
  assert.match(workshop, /use the generated fake key below/i);
  assert.match(visible, /never commit the tracking folder/i);
});

test('Level 2 introduces the intent as a narrative while preserving learner agency and scope', () => {
  const start = workshop.indexOf('# Level 2:');
  const topic = withoutDetails(workshop.slice(workshop.indexOf('## Topic', start),
    workshop.indexOf('**Why this level:**', start)));
  const paragraphs = topic.replace(/^## Topic\n/, '').trim().split(/\n\s*\n/);
  assert.equal(paragraphs.length, 1, 'the introduction is a concise narrative');
  assert.doesNotMatch(topic, /^(?:[-*] |Handoff:|Boundary:)/m);
  for (const phrase of [
    'listening situation you choose', 'challenge assumptions', 'compare ideas',
    'not proof of completed methods or a validated concept',
    'reviewed delivery brief', 'bounded later-slice idea of your choice',
    "facilitator's shared playlist contract fixed",
  ]) assert.ok(topic.includes(phrase), phrase);
});

test('Level 2 presents the actual starter scenario and source layout before coaching', () => {
  const level2 = workshop.slice(workshop.indexOf('# Level 2:'), workshop.indexOf('## Start a DT project'));
  const visible = withoutDetails(level2);
  assert.match(visible, /## Scenario: Music Catalog/);
  assert.match(visible, /currently displays a greeting from the API/);
  assert.match(visible, /Later, you will add catalog browsing and one in-memory playlist/);
  for (const path of [
    'src/api/Program.cs', 'src/api/Data/tracks.json', 'src/front/src/App.tsx',
    'src/front/src/main.tsx', 'src/front/vite.config.ts',
  ]) assert.ok(existsSync(resolve(root, path)), path);
  assert.match(read('src/api/Program.cs'), /MapGet\("\/api\/hello"/);
  assert.match(read('src/front/src/App.tsx'), /fetch\('\/api\/hello'\)/);
  assert.match(read('src/front/vite.config.ts'), /proxy/);
  assert.match(visible, /Program\.cs.*API entry point/);
  assert.match(visible, /src\/App\.tsx.*React screen/);
});

test('Workshop Creator loads the canonical local skill without changing its handoffs', () => {
  const reference = creator.match(/#file:(\.\.\/skills\/workshop-authoring\/SKILL\.md)/);
  assert.ok(reference);
  assert.ok(existsSync(resolve(dirname(resolve(root, '.github/agents/workshop-creator.agent.md')), reference[1])));
  assert.match(creator, /activate `workshop-authoring`/);
  assert.match(creator, /If the skill cannot be loaded, stop content authoring/);
  const metadata = frontmatter(creator);
  assert.deepEqual([...metadata.matchAll(/^    agent: (.+)$/gm)].map(match => match[1]),
    ['DT Coach', 'RPI Agent', 'RPI Agent', 'PowerPoint Builder', 'Workshop Creator']);
  const prompts = [...metadata.matchAll(/^    prompt: "(.+)"$/gm)].map(match => match[1]);
  assert.equal(prompts.length, 5);
  assert.equal([...metadata.matchAll(/^    send: false$/gm)].length, 5);
  for (const prompt of prompts) {
    assert.match(prompt, /blueprint path supplied in this handoff context/);
    assert.match(prompt, /Stop if that path is unavailable or ambiguous/);
    assert.match(prompt, /Linux\/Bash-only lab guardrail and delivery boundaries/);
  }
  assert.match(creator, /trusted private blueprint path outside that default/);
  assert.match(creator, /the caller must supply the concrete path/);
  assert.match(creator, /historical approvals as unverified/);
  assert.doesNotMatch(creator, /[A-Z]:\\|\/Users\/|session-state\//);
});

test('the authoring skill records progressive disclosure without weakening the required path', () => {
  const metadata = frontmatter(skill);
  assert.match(metadata, /^name: workshop-authoring$/m);
  assert.match(metadata, /^description: "[^"]*Use when[^"]+"$/m);
  assert.doesNotMatch(metadata, /^(tools|model|agent|handoffs|applyTo):/m);
  assert.match(skill, /## Documented decision: progressive disclosure/);
  assert.match(skill, /default-collapsed `<details>`/);
  assert.match(skill, /Keep required commands, starter prompts, success criteria, prerequisites/);
  assert.match(skill, /permission or licensing warnings, and human approval gates visible/);
  assert.match(skill, /## Stop rules/);
  assert.match(read('docs/maintainer-handbook.md'), /\| D21 \| Progressive disclosure/);
  assert.match(read('CONTRIBUTING.md'), /Workshop Authoring/);
});

test('formal BRD/PRD authoring is opt-in while work-item planning and curation stay outside it', () => {
  const start = workshop.indexOf('## Extended track: Product Manager with HVE-Core');
  const end = workshop.indexOf('## Plan and create the work items', start);
  assert.ok(start >= 0 && end > start);
  const extended = workshop.slice(start, end);
  assert.match(extended, /\*\*Optional:\*\*/);
  assert.match(extended, /<details>\n<summary>Optional extended track: BRD and PRD authoring<\/summary>/);
  const closed = withoutDetails(extended);
  assert.match(closed, /\[Plan and create the work items\]\(https:\/\/moaw\.dev\/workshop\/gh:Justrebl\/AI-SDLC-Workshop\/main\/docs\/afternoon-2\/\?step=2#plan-and-create-the-work-items\)/);
  assert.doesNotMatch(closed, /### Step [1-8]|Create a business requirements document|Move from the BRD work|Execute the plan/);
  assert.match(withoutDetails(workshop), /## Curate what you commit/);
  assert.equal(withoutDetails('before<details>outer<details>inner</details>tail</details>after'), 'beforeafter');
  assert.throws(() => withoutDetails('<details>unclosed'), /Unbalanced/);
});

test('Tech Lead work is opt-in while required publication and human acceptance stay visible', () => {
  const start = workshop.indexOf('## Extended track: Tech Lead with HVE-Core');
  const end = workshop.indexOf('## Publish the reviewed pull request', start);
  assert.ok(start >= 0 && end > start);
  const extension = workshop.slice(start, end);
  assert.match(extension, /\*\*Optional:\*\*/);
  assert.match(extension, /<details>\n<summary>Optional extended track: ADR authoring and Code Review<\/summary>/);
  const closed = withoutDetails(extension);
  assert.match(closed, /\[Publish the reviewed pull request\]\(https:\/\/moaw\.dev\/workshop\/gh:Justrebl\/AI-SDLC-Workshop\/main\/docs\/afternoon-2\/\?step=3#publish-the-reviewed-pull-request\)/);
  assert.match(closed, /optional work does not waive review findings or approval gates/);
  assert.doesNotMatch(closed, /### Step [1-3]:|\/hve-core:adr-author|Review the local commits/);
  const required = withoutDetails(workshop.slice(end, workshop.indexOf('# Level 4:', end)));
  assert.match(required, /\*\*Required:\*\*/);
  assert.match(required, /\/hve-core:pull-request/);
  assert.match(required, /Nothing is published until you confirm the push and PR creation/);
  assert.match(required, /A human reviewer inspects and approves/);
  assert.match(required, /Verify that the Level 3 PR is merged/);
  assert.match(required, /default branch includes the merged Level 3 pull request/);
});

test('the standalone backlog resumes the DT slug or matching signed-off PRD without requiring the optional chain', () => {
  const start = workshop.indexOf('## Plan and create the work items');
  const end = workshop.indexOf('## Curate what you commit', start);
  const direct = workshop.slice(start, end);
  assert.ok(start > workshop.indexOf('## Extended track: Product Manager'));
  const closed = withoutDetails(workshop);
  assert.match(closed, /## Plan and create the work items/);
  assert.match(closed, /### Step 1: Plan the work items from the project context/);
  assert.match(closed, /### Step 2: Create the issues/);
  assert.match(closed, /### Step 3: Verify the backlog on GitHub/);
  assert.match(closed, /### Step 4: Get a sprint order/);
  assert.match(closed, /### Step 5: Hand off to curation/);
  const jump = workshop.slice(workshop.indexOf('### After DT Coach: Continue to backlog planning'),
    workshop.indexOf('## Debrief and hand off to the shared implementation slice'));
  assert.match(jump, /\[Plan and create the work items\]\(https:\/\/moaw\.dev\/workshop\/gh:Justrebl\/AI-SDLC-Workshop\/main\/docs\/afternoon-2\/\?step=2#plan-and-create-the-work-items\)/);
  assert.match(direct, /\/agent functional-planner/);
  assert.match(direct, /without clearing the DT context/);
  assert.match(direct, /Help me plan the backlog for music-catalog-listening-experience/);
  assert.match(direct, /Resume the confirmed Design Thinking Coach decisions, or use the matching signed-off PRD/);
  assert.match(direct, /Guide me through potential gaps before preparing the work items/);
  assert.match(direct, /actual recap, decisions and saved requirements artifacts/);
  assert.match(direct, /needs a concrete PRD source before decomposition/);
  assert.match(direct, /Keep planning paused/);
  assert.match(direct, /Do not select the newest file or an unrelated playlist PRD/);
  assert.match(direct, /file existence is not sign-off/);
  assert.match(direct, /sampler or preview is not proof that all nine methods are complete/);
  assert.match(direct, /No new issue is created on GitHub during planning/);
  assert.match(direct, /After you confirm, Backlog Manager creates the approved issues/);
  assert.match(direct, /return to \*\*DT Coach\*\*/);
  assert.match(direct, /shared Level 3 playlist scope unchanged/);
  assert.match(closed, /including if you returned from the early work-item route/);
});
