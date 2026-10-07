#!/usr/bin/env bash
# Shared helpers for the AI SDLC with Github Copilot and HVE Core workshop tester.
# Results are written as JSON Lines so the validation agent can compare them with docs/afternoon-2/workshop.md.

: "${RESULTS_DIR:=/tmp/workshop-tester}"
mkdir -p "$RESULTS_DIR/steps" "$RESULTS_DIR/sessions" "$RESULTS_DIR/usage" "$RESULTS_DIR/copilot-logs" "$RESULTS_DIR/prompts"
RESULTS_FILE="$RESULTS_DIR/results.jsonl"
touch "$RESULTS_FILE"

CURRENT_CHECKS=""
CURRENT_NOTES=""

json_escape() {
  local s=${1-}
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\n'/\\n}
  s=${s//$'\r'/}
  s=${s//$'\t'/\\t}
  printf '%s' "$s" | tr -d '\000-\010\013\014\016-\037'
}

redact() {
  # Never keep tokens in logs, even if a tool echoes its environment.
  local f=$1 v
  [ -f "$f" ] || return 0
  for v in "${GH_TOKEN-}" "${COPILOT_GITHUB_TOKEN-}" "${SANDBOX_TOKEN-}"; do
    if [ -n "$v" ]; then sed -i "s|${v}|***|g" "$f"; fi
  done
  sed -i -E 's/(gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}/***/g' "$f"
}

redact_str() {
  local s=$1 v
  for v in "${GH_TOKEN-}" "${COPILOT_GITHUB_TOKEN-}" "${SANDBOX_TOKEN-}"; do
    if [ -n "$v" ]; then s=${s//"$v"/***}; fi
  done
  printf '%s' "$s" | sed -E 's/(gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}/***/g'
}

check() {
  # check <name> <true|false> [detail]
  local item
  item=$(printf '{"name":"%s","pass":%s,"detail":"%s"}' "$(json_escape "$1")" "$2" "$(json_escape "${3-}")")
  if [ -z "$CURRENT_CHECKS" ]; then CURRENT_CHECKS=$item; else CURRENT_CHECKS="$CURRENT_CHECKS,$item"; fi
}

note() {
  if [ -z "$CURRENT_NOTES" ]; then CURRENT_NOTES=$1; else CURRENT_NOTES="$CURRENT_NOTES | $1"; fi
}

record() {
  # record <id> <level> <title> <mode> <command> <exit_code> <duration_s> <status>
  local log="steps/$1.log" tail_text=""
  if [ -f "$RESULTS_DIR/$log" ]; then
    redact "$RESULTS_DIR/$log"
    tail_text=$(tail -n 40 "$RESULTS_DIR/$log")
  fi
  printf '{"id":"%s","level":"%s","title":"%s","mode":"%s","command":"%s","exit_code":%s,"duration_s":%s,"status":"%s","checks":[%s],"notes":"%s","log":"%s","log_tail":"%s"}\n' \
    "$(json_escape "$1")" "$(json_escape "$2")" "$(json_escape "$3")" "$4" \
    "$(json_escape "$(redact_str "$5")")" "$6" "$7" "$8" "$(redact_str "$CURRENT_CHECKS")" \
    "$(json_escape "$(redact_str "$CURRENT_NOTES")")" "$log" "$(json_escape "$tail_text")" >> "$RESULTS_FILE"
  CURRENT_CHECKS=""
  CURRENT_NOTES=""
  printf '[%s] %-34s %s (exit %s, %ss)\n' "$8" "$1" "$3" "$6" "$7"
}

# step <id> <level> <title> <mode> <timeout_s> <command>
# mode: literal    = the lab command as written
#       translated = published intent adapted for the disposable sandbox
#       emulated   = UI or interactive lab step replayed non-interactively
# Add check() calls after step, then call finish_step.
STEP_ID="" STEP_LEVEL="" STEP_TITLE="" STEP_MODE="" STEP_CMD="" STEP_CODE=0 STEP_DUR=0 STEP_FAILED=0
step() {
  STEP_ID=$1 STEP_LEVEL=$2 STEP_TITLE=$3 STEP_MODE=$4
  STEP_FAILED=0
  local to=$5 start
  STEP_CMD=$6
  start=$(date +%s)
  timeout --kill-after=30 "$to" bash -c "$STEP_CMD" > "$RESULTS_DIR/steps/$STEP_ID.log" 2>&1 < /dev/null
  STEP_CODE=$?
  STEP_DUR=$(( $(date +%s) - start ))
  if [ "$STEP_CODE" -eq 124 ] || [ "$STEP_CODE" -eq 137 ]; then note "timed out after ${to}s"; fi
}

finish_step() {
  # finish_step [expected_exit_code|any]
  local expected=${1-0} status=pass
  if [ "$expected" != any ] && [ "$STEP_CODE" -ne "$expected" ]; then status=fail; fi
  if printf '%s' "$CURRENT_CHECKS" | grep -q '"pass":false'; then status=fail; fi
  if [ "$status" = fail ]; then STEP_FAILED=1; else STEP_FAILED=0; fi
  record "$STEP_ID" "$STEP_LEVEL" "$STEP_TITLE" "$STEP_MODE" "$STEP_CMD" "$STEP_CODE" "$STEP_DUR" "$status"
}

skip_step() {
  # skip_step <id> <level> <title> <reason>
  note "$4"
  record "$1" "$2" "$3" skipped "" 0 0 skip
}

log_has() { grep -qiE "$1" "$RESULTS_DIR/steps/$STEP_ID.log"; }

changed_outside_tracking() {
  git status --porcelain | sed -E 's/^...//' | grep -v '^\.copilot-tracking/' || true
}

implementation_changes_since() {
  local tracked untracked
  tracked=$(git diff --name-only "$1" -- src/api tests/api src/front) || return
  untracked=$(git ls-files --others --exclude-standard -- src/api tests/api src/front) || return
  printf '%s\n%s\n' "$tracked" "$untracked" | sed '/^$/d' | sort -u
}

commit_checkpoint() {
  local diff_code
  git status || return
  git add -A || return
  if git diff --cached --quiet; then
    echo "Nothing to commit; keeping the existing checkpoint."
  else
    diff_code=$?
    [ "$diff_code" -eq 1 ] || return "$diff_code"
    git commit -m "$1"
  fi
}

tree_clean_check() {
  # HVE-Core writes working state under .copilot-tracking/: ignored working state, never committed.
  if [ -z "$(git status --porcelain)" ]; then
    check "working tree clean" true
  elif [ -z "$(changed_outside_tracking)" ]; then
    check "working tree clean outside .copilot-tracking/" true "$(git status --porcelain | head -n 20)"
    note "agent wrote notes under .copilot-tracking/"
  else
    check "working tree clean" false "$(git status --porcelain | head -n 30)"
  fi
}

resolve_rpi_artifact() {
  local kind=$1 response=$2 slug=${3-} root suffix name
  local matches=()
  case "$kind" in
    research) root=research; suffix=research ;;
    plan) root=plans; suffix=plan ;;
    changes) root=changes; suffix=changes ;;
    review) root=reviews/logs; suffix=review ;;
    *) printf 'Unsupported RPI artifact kind: %s\n' "$kind" >&2; return 1 ;;
  esac
  if [ ! -r "$response" ]; then
    printf 'RPI response is unavailable: %s\n' "$response" >&2
    return 1
  fi
  if [ -n "$slug" ] && [[ ! "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    printf 'Invalid RPI task slug: %s\n' "$slug" >&2
    return 1
  fi
  name=${slug:-'[a-z0-9]+(-[a-z0-9]+)*'}
  if [ "$kind" = review ]; then name="$name-$suffix(-[0-9]+)?"; else name="$name-$suffix"; fi
  mapfile -t matches < <(grep -oE "\\.copilot-tracking/$root/[0-9]{4}-[0-9]{2}-[0-9]{2}/$name\\.md([^[:alnum:]_./-]|$)" "$response" \
    | sed -E 's/\.md[^[:alnum:]_./-]$/\.md/' | sort -u)
  if [ "${#matches[@]}" -ne 1 ]; then
    printf 'Expected one returned %s artifact for this task, found %s; do not choose by recency.\n' "$kind" "${#matches[@]}" >&2
    return 1
  fi
  if [ ! -f "${matches[0]}" ] || [ ! -r "${matches[0]}" ]; then
    printf 'Returned RPI artifact is missing or unreadable: %s\n' "${matches[0]}" >&2
    return 1
  fi
  printf '%s\n' "${matches[0]}"
}

render_workshop_prompt() {
  local text kind placeholder path
  text=$(cat "$1") || return
  for kind in research plan changes; do
    placeholder="<$kind-path>"
    [[ "$text" == *"$placeholder"* ]] || continue
    case "$kind" in
      research) path=${RPI_RESEARCH_PATH-} ;;
      plan) path=${RPI_PLAN_PATH-} ;;
      changes) path=${RPI_CHANGES_PATH-} ;;
    esac
    if [ -z "$path" ] || [ ! -f "$path" ] || [ ! -r "$path" ]; then
      printf 'Cannot resolve %s: this task has no readable returned artifact.\n' "$placeholder" >&2
      return 1
    fi
    text=${text//"$placeholder"/"$path"}
  done
  printf '%s\n' "$text"
}

validated_results_subtree() {
  local results=$RESULTS_DIR
  if command -v cygpath >/dev/null 2>&1; then
    results=$(cygpath -w -- "$results") || return
  fi
  node - "$results" <<'NODE'
const { spawnSync } = require('node:child_process');
const { realpathSync, statSync } = require('node:fs');
const { relative, resolve, sep, isAbsolute, parse } = require('node:path');
function git(...args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  return result.stdout;
}
const root = realpathSync(git('rev-parse', '--show-toplevel').trim());
const results = realpathSync(process.argv[2]);
function within(parent, child) {
  const path = relative(parent, child);
  return !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`);
}
if (!statSync(results).isDirectory() || results === parse(results).root || relative(root, results) === '') {
  throw new Error('RESULTS_DIR must be a private directory, not a filesystem or repository root.');
}
for (const flag of ['--absolute-git-dir', '--git-common-dir']) {
  const metadata = realpathSync(resolve(root, git('rev-parse', flag).trim()));
  if (within(metadata, results)) throw new Error('RESULTS_DIR cannot be inside Git metadata.');
}
if (!within(root, results)) process.exit(0);
const subtree = relative(root, results).split(sep).join('/');
if (/[\r\n]/.test(subtree)) throw new Error('RESULTS_DIR cannot contain line breaks.');
const fold = value => process.platform === 'win32' ? value.toLowerCase() : value;
const top = fold(subtree.split('/')[0]);
const tracked = git('ls-files', '--cached', '-z').split('\0').filter(Boolean).map(fold);
if (tracked.some(path => path === top || path.startsWith(`${top}/`))) {
  throw new Error('An internal RESULTS_DIR requires a dedicated untracked namespace, not public source.');
}
process.stdout.write(subtree);
NODE
}

prepare_results_directory() {
  local subtree
  subtree=$(validated_results_subtree) || return
  [ -n "$subtree" ] || return 0
  node - "$subtree" <<'NODE'
const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { dirname } = require('node:path');
const result = spawnSync('git', ['rev-parse', '--git-path', 'info/exclude'], { encoding: 'utf8' });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || 'Cannot resolve local Git exclusion file.');
const path = result.stdout.trim();
const pattern = '/' + process.argv[2].replace(/[\\*?\[\]]/g, '\\$&') + '/';
const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
if (!existing.split(/\r?\n/).includes(pattern)) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, existing + (existing && !existing.endsWith('\n') ? '\n' : '') + pattern + '\n');
}
NODE
}

repository_review_snapshot() {
  local subtree
  subtree=$(validated_results_subtree) || return
  node - "$subtree" <<'NODE'
const { spawnSync } = require('node:child_process');
const { lstatSync, readFileSync, readlinkSync } = require('node:fs');
const { createHash } = require('node:crypto');
function git(...args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  return result.stdout;
}
const fold = value => process.platform === 'win32' ? value.toLowerCase() : value;
const privatePrefix = process.argv[2] ? fold(process.argv[2]) + '/' : '';
const paths = [...new Set(git('ls-files', '--cached', '--others', '--exclude-standard', '-z')
  .split('\0').filter(path => path && !path.startsWith('.copilot-tracking/') &&
    !(privatePrefix && fold(path).startsWith(privatePrefix))))].sort();
const files = paths.map(path => {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (!stat) return [path, 'missing'];
  const content = stat.isSymbolicLink() ? readlinkSync(path) : readFileSync(path);
  return [path, stat.mode, createHash('sha256').update(content).digest('hex')];
});
process.stdout.write(JSON.stringify({
  head: git('rev-parse', 'HEAD').trim(),
  index: git('ls-files', '--stage', '-z'),
  files,
}));
NODE
}

review_acceptance() {
  node - "$1" <<'NODE'
const { readFileSync } = require('node:fs');
const text = readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n').replace(/\*\*/g, '');
const parents = text.split(/^## Parent Decision Record[ \t]*$/m);
if (parents.length !== 2) {
  console.error('Review must contain one canonical Parent Decision Record; publication blocked.');
  process.exit(1);
}
const dispositions = parents[1].split(/^## /m)[0]
  .split(/^### Current Disposition[ \t]*$/m);
if (dispositions.length !== 2) {
  console.error('Review must contain one canonical Current Disposition; publication blocked.');
  process.exit(1);
}
const disposition = dispositions[1].split(/^### /m)[0];
const executions = [...disposition.matchAll(/^[*-] Review execution: ([^\n]+)$/gm)];
const outcomes = [...disposition.matchAll(/^[*-] Final outcome: ([^\n]+)$/gm)];
if (executions.length !== 1 || outcomes.length !== 1 ||
    !/^Complete(?:[.;]|$)/.test(executions[0][1].trim()) ||
    !/^Conformant(?: with justified divergence)?(?:[.;]|$)/.test(outcomes[0][1].trim())) {
  console.error('Review has no unique completed, conformant parent decision; publication blocked.');
  process.exit(1);
}
console.log('Canonical Review execution Complete and outcome Conformant verified.');
NODE
}

# copilot_prompt <id> <level> <title> <prompt_name> <timeout_s> [extra copilot args]
# Replays a lab prompt verbatim (extracted from workshop.md) through Copilot CLI non-interactive mode.
copilot_prompt() {
  local id=$1 level=$2 title=$3 file="$RESULTS_DIR/prompts/$4.txt" to=$5 extra=${6-}
  local resolved="$RESULTS_DIR/prompts/$id-resolved.txt"
  if [ ! -s "$file" ] || [ ! -s "$RESULTS_DIR/prompts/replay-policy.txt" ]; then
    CURRENT_CHECKS="" ; check "prompt '$4' extracted from workshop.md" false "missing $file"
    STEP_ID=$id STEP_LEVEL=$level STEP_TITLE=$title STEP_MODE=emulated STEP_CMD="" STEP_CODE=1 STEP_DUR=0
    return
  fi
  if ! render_workshop_prompt "$file" > "$resolved"; then
    CURRENT_CHECKS="" ; check "prompt '$4' uses this task's artifacts" false "missing or unreadable RPI artifact; invocation blocked"
    STEP_ID=$id STEP_LEVEL=$level STEP_TITLE=$title STEP_MODE=emulated STEP_CMD="" STEP_CODE=1 STEP_DUR=0
    return
  fi
  # Least privilege: the agent never sees the sandbox token (Copilot CLI authenticates with COPILOT_GITHUB_TOKEN),
  # cannot call obvious network or credential commands, and its URL tools only reach GitHub. Shell commands can
  # still open connections; only the optional egress lock (infra-harden) blocks those.
  step "$id" "$level" "$title" emulated "$to" \
    "env -u GH_TOKEN -u GITHUB_TOKEN copilot -p \"\$(cat '$RESULTS_DIR/prompts/replay-policy.txt'; printf '\\nCurrent workshop message:\\n'; cat '$resolved')\" --allow-all-tools \
      --deny-tool='shell(curl)' --deny-tool='shell(wget)' --deny-tool='shell(gh auth)' --deny-tool='shell(git push)' --deny-tool='shell(ssh)' \
      --allow-url=github.com --allow-url=api.github.com --add-dir '$RESULTS_DIR' \
      --no-ask-user --no-color --log-dir '$RESULTS_DIR/copilot-logs' --usage-output-file '$RESULTS_DIR/usage/$id.json' --share '$RESULTS_DIR/sessions/$id.md' $extra"
  note "published prompt with curated-solution replay policy; copilot -p --allow-all-tools (curl, wget, gh auth, git push and ssh denied; URLs limited to GitHub; GH_TOKEN unset) ${extra}"
  redact "$RESULTS_DIR/sessions/$id.md"
}

wait_http() {
  # wait_http <url> <timeout_s>
  local i=0
  while [ "$i" -lt "$2" ]; do
    curl -fsS -o /dev/null "$1" && return 0
    sleep 2; i=$((i + 2))
  done
  return 1
}

http_status() {
  # http_status <method> <url> [json_body] -> prints status code, saves the response body.
  if [ "$#" -ge 3 ]; then
    curl -sS -o "$RESULTS_DIR/http-last.json" -w '%{http_code}' -X "$1" \
      -H 'Content-Type: application/json' --data "$3" "$2"
    return
  fi
  curl -sS -o "$RESULTS_DIR/http-last.json" -w '%{http_code}' -X "$1" "$2"
}
