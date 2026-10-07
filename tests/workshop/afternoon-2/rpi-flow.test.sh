#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
FIXTURE_ROOT=$(mktemp -d -t workshop-rpi-flow.XXXXXX)
trap 'rm -rf "$FIXTURE_ROOT"' EXIT
export RESULTS_DIR="$FIXTURE_ROOT/results"
. "$SCRIPT_DIR/lib.sh"
mkdir "$FIXTURE_ROOT/workspace"
cd "$FIXTURE_ROOT/workspace"

equal() {
  if [ "$1" != "$2" ]; then
    printf 'Expected <%s>, got <%s>\n' "$2" "$1" >&2
    exit 1
  fi
}

reject() {
  if "$@" > "$FIXTURE_ROOT/rejected.log" 2>&1; then
    printf 'Expected failure: %s\n' "$*" >&2
    exit 1
  fi
}

mkdir -p .copilot-tracking/research/2026-10-05 .copilot-tracking/plans/2026-10-05 \
  .copilot-tracking/changes/2026-10-05 .copilot-tracking/reviews/logs/2026-10-05
research=.copilot-tracking/research/2026-10-05/playlist-research.md
plan=.copilot-tracking/plans/2026-10-05/playlist-plan.md
changes=.copilot-tracking/changes/2026-10-05/playlist-changes.md
review=.copilot-tracking/reviews/logs/2026-10-05/playlist-review.md
printf 'research\n' > "$research"
printf 'plan\n' > "$plan"
printf 'changes\n' > "$changes"
printf 'review\n' > "$review"
printf 'Artifact: [%s](%s)\n' "$research" "$research" > response.txt
equal "$(resolve_rpi_artifact research response.txt)" "$research"
echo "pass: repeated links resolve to one returned research artifact"

printf 'Backup: %s.bak\n' "$research" > response.txt
reject resolve_rpi_artifact research response.txt
echo "pass: a backup filename cannot be mistaken for the returned artifact"

printf 'Artifact: %s\n' "$plan" > response.txt
equal "$(resolve_rpi_artifact plan response.txt playlist)" "$plan"
reject resolve_rpi_artifact plan response.txt another-task
grep -q 'found 0' "$FIXTURE_ROOT/rejected.log"
echo "pass: Plan must belong to the research task"

printf 'Artifact: %s\n' "$changes" > response.txt
equal "$(resolve_rpi_artifact changes response.txt playlist)" "$changes"
printf 'Artifact: %s\n' "$review" > response.txt
equal "$(resolve_rpi_artifact review response.txt playlist)" "$review"
echo "pass: changes and Review preserve the same task identity"

printf 'No artifact was returned.\n' > response.txt
reject resolve_rpi_artifact research response.txt
printf 'Artifact: .copilot-tracking/research/2026-10-05/missing-research.md\n' > response.txt
reject resolve_rpi_artifact research response.txt
grep -q 'missing or unreadable' "$FIXTURE_ROOT/rejected.log"
echo "pass: unreported and nonexistent artifacts fail"

other=.copilot-tracking/research/2026-10-05/another-task-research.md
printf 'other research\n' > "$other"
printf 'Artifacts: %s and %s\n' "$research" "$other" > response.txt
reject resolve_rpi_artifact research response.txt
grep -q 'found 2; do not choose by recency' "$FIXTURE_ROOT/rejected.log"
echo "pass: ambiguous returned artifacts do not select the newest"

printf 'Plan from <research-path>; implement <plan-path>; review <changes-path>.\n' > prompt.txt
export RPI_RESEARCH_PATH=$research RPI_PLAN_PATH=$plan RPI_CHANGES_PATH=$changes
equal "$(render_workshop_prompt prompt.txt)" "Plan from $research; implement $plan; review $changes."
printf 'Ordinary workshop message.\n' > prompt.txt
equal "$(render_workshop_prompt prompt.txt)" "Ordinary workshop message."
echo "pass: only artifact placeholders are replaced; ordinary messages remain unchanged"

printf 'Plan from <research-path>.\n' > prompt.txt
unset RPI_RESEARCH_PATH
reject render_workshop_prompt prompt.txt
grep -q 'Cannot resolve <research-path>' "$FIXTURE_ROOT/rejected.log"
export RPI_RESEARCH_PATH=.copilot-tracking/research/2026-10-05/missing-research.md
reject render_workshop_prompt prompt.txt
echo "pass: unset and missing bindings fail instead of becoming empty paths"

printf 'replay policy\n' > "$RESULTS_DIR/prompts/replay-policy.txt"
cp prompt.txt "$RESULTS_DIR/prompts/fixture.txt"
step() { echo "Copilot must not be invoked with unresolved artifacts" >&2; exit 99; }
copilot_prompt fixture "Level 3" "Fixture" fixture 30 > "$FIXTURE_ROOT/blocked-invocation.log" 2>&1
equal "$STEP_CODE" 1
[[ "$CURRENT_CHECKS" == *'"pass":false'* ]]
echo "pass: unresolved placeholders block the agent invocation"

curl() {
  printf '%s\0' "$@" > "$FIXTURE_ROOT/curl-args"
  printf '200'
}
equal "$(http_status POST https://example.invalid/api/playlist/tracks '{"trackId":"t1"}')" 200
mapfile -d '' -t args < "$FIXTURE_ROOT/curl-args"
equal "${#args[@]}" 12
equal "${args[6]}" POST
equal "${args[8]}" 'Content-Type: application/json'
equal "${args[10]}" '{"trackId":"t1"}'
equal "${args[11]}" https://example.invalid/api/playlist/tracks
echo "pass: playlist POST sends the JSON request body intact"

equal "$(http_status GET https://example.invalid/api/tracks)" 200
mapfile -d '' -t args < "$FIXTURE_ROOT/curl-args"
equal "${#args[@]}" 8
equal "${args[6]}" GET
equal "${args[7]}" https://example.invalid/api/tracks
echo "pass: GET behavior is unchanged"

mkdir "$FIXTURE_ROOT/review-workspace"
cd "$FIXTURE_ROOT/review-workspace"
git init -q
git config user.name "Workshop fixture"
git config user.email "fixture@example.invalid"
mkdir -p src/api docs .copilot-tracking/reviews
printf 'baseline\n' > src/api/source.txt
printf '.copilot-tracking/\n' > .gitignore
git add src .gitignore
git commit -qm "Fixture baseline"
clean_snapshot=$(repository_review_snapshot)
equal "$(repository_review_snapshot)" "$clean_snapshot"
printf 'implementation\n' >> src/api/source.txt
printf 'new test\n' > untracked-test.txt
dirty_snapshot=$(repository_review_snapshot)
[ "$dirty_snapshot" != "$clean_snapshot" ]
equal "$(repository_review_snapshot)" "$dirty_snapshot"
printf 'private review\n' > .copilot-tracking/reviews/review.md
equal "$(repository_review_snapshot)" "$dirty_snapshot"
echo "pass: stable clean/dirty trees include untracked content but permit private review output"

printf 'mutated\n' >> src/api/source.txt
[ "$(repository_review_snapshot)" != "$dirty_snapshot" ]
printf 'implementation\n' > src/api/source.txt
before_untracked=$(repository_review_snapshot)
printf 'mutated test\n' >> untracked-test.txt
[ "$(repository_review_snapshot)" != "$before_untracked" ]
before_docs=$(repository_review_snapshot)
printf 'unexpected public write\n' > docs/review-result.md
[ "$(repository_review_snapshot)" != "$before_docs" ]
echo "pass: Review mutations to tracked source, untracked tests and public docs are detected"

before_index=$(repository_review_snapshot)
git add src/api/source.txt
[ "$(repository_review_snapshot)" != "$before_index" ]
before_head=$(repository_review_snapshot)
git commit -qm "Unexpected review commit"
[ "$(repository_review_snapshot)" != "$before_head" ]
echo "pass: index and HEAD changes cannot hide behind a clean working tree"

external_results=$RESULTS_DIR
external_snapshot=$(repository_review_snapshot)
mkdir -p "private results[1]/prompts" "private results[1]/usage" "private results[1]/sessions"
RESULTS_DIR="$PWD/private results[1]"
printf 'result\n' > "$RESULTS_DIR/results.jsonl"
printf 'resolved request\n' > "$RESULTS_DIR/prompts/review.txt"
printf '{}\n' > "$RESULTS_DIR/usage/review.json"
printf 'transcript\n' > "$RESULTS_DIR/sessions/review.md"
equal "$(repository_review_snapshot)" "$external_snapshot"
prepare_results_directory
prepare_results_directory
git check-ignore -- "private results[1]/results.jsonl" >/dev/null
mkdir "private results1"
printf 'public sibling\n' > "private results1/source.txt"
reject git check-ignore -- "private results1/source.txt"
before_sibling=$(repository_review_snapshot)
printf 'changed\n' >> "private results1/source.txt"
[ "$(repository_review_snapshot)" != "$before_sibling" ]
RESULTS_DIR="./private results[1]"
equal "$(repository_review_snapshot)" "$(RESULTS_DIR="$PWD/private results[1]" repository_review_snapshot)"
git add -A
reject git ls-files --error-unmatch -- ':(literal)private results[1]/results.jsonl'
git add -f -- ':(literal)private results[1]/results.jsonl'
reject validated_results_subtree
git restore --staged -- ':(literal)private results[1]/results.jsonl'
RESULTS_DIR=$(node -p 'require("node:path").parse(process.cwd()).root')
reject validated_results_subtree
RESULTS_DIR="$PWD"
reject validated_results_subtree
RESULTS_DIR="$PWD/.git"
reject validated_results_subtree
RESULTS_DIR="$PWD/src/api"
reject validated_results_subtree
RESULTS_DIR=$external_results
prepare_results_directory
echo "pass: private internal/external results stay out of snapshots and staging; unsafe roots reject and public siblings remain visible"

if ln -s missing-one broken-link 2>"$FIXTURE_ROOT/symlink-error.log"; then
  before_link=$(repository_review_snapshot)
  rm broken-link
  ln -s missing-two broken-link
  [ "$(repository_review_snapshot)" != "$before_link" ]
  echo "pass: broken symlink targets are compared without reading external content"
else
  case "$(uname -s)" in
    MINGW*|MSYS*) echo "skip: Windows host cannot create the broken-symlink fixture; run it on Linux" ;;
    *) cat "$FIXTURE_ROOT/symlink-error.log" >&2; exit 1 ;;
  esac
fi

cat > canonical-review.md <<'EOF'
## Executive Summary
Assessed outcome: Conformant.
## Parent Decision Record
### Current Disposition
* Review execution: Complete
* Final outcome: Conformant
### Decision History
Final decisions are recorded here.
EOF
review_acceptance canonical-review.md
sed 's/Final outcome: Conformant/Final outcome: Conformant with justified divergence/' canonical-review.md > divergent-review.md
review_acceptance divergent-review.md
echo "pass: only the canonical parent's completed, conformant decision permits publication"

sed 's/Final outcome: Conformant/Final outcome: pending/' canonical-review.md > pending-review.md
reject review_acceptance pending-review.md
sed 's/Final outcome: Conformant/Final outcome: Defects found/' canonical-review.md > defects-review.md
reject review_acceptance defects-review.md
sed 's/Review execution: Complete/Review execution: Partial/' canonical-review.md > partial-review.md
reject review_acceptance partial-review.md
echo "pass: pending decisions, implementation defects and partial review block the checkpoint"

printf 'Conformant\n' > phrase-only.md
reject review_acceptance phrase-only.md
reject review_acceptance missing-review.md
cat canonical-review.md canonical-review.md > ambiguous-review.md
reject review_acceptance ambiguous-review.md
for outcome in pending 'Defects found' Conformant; do
  cp canonical-review.md duplicate-disposition.md
  printf '\n### Current Disposition\n* Review execution: Complete\n* Final outcome: %s\n' \
    "$outcome" >> duplicate-disposition.md
  reject review_acceptance duplicate-disposition.md
done
sed '/Final outcome: Conformant/a * Final outcome: pending' canonical-review.md > duplicate-fields.md
reject review_acceptance duplicate-fields.md
sed '/Review execution: Complete/a * Review execution: Partial' canonical-review.md > duplicate-execution.md
reject review_acceptance duplicate-execution.md
echo "pass: success phrases, missing files and ambiguous parent records do not substitute for acceptance"
