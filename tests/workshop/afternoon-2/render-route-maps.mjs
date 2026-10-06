import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const source = readFileSync(new URL('../../../docs/afternoon-2/assets/a2-route-map.mmd', import.meta.url), 'utf8');
export function diagramForLevel(level) {
  if (!Number.isInteger(level) || level < 0 || level > 6) {
    throw new RangeError('Route-map level must be an integer from 0 to 6');
  }
  return level === 0 ? source : source
    .replace('The SDLC Workshop - route ahead', `The SDLC Workshop - current focus: Level ${level}`)
    .replace('    class l1,l2,l3,l4,l5,l6,recap upcoming',
      `    class ${['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'recap'].filter(id => id !== `l${level}`).join(',')} upcoming\n    class l${level} current`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const temporary = mkdtempSync(join(tmpdir(), 'workshop-route-maps-'));
  try {
    const config = join(temporary, 'config.json');
    writeFileSync(config, JSON.stringify({
      theme: 'base',
      htmlLabels: false,
      themeVariables: {
        fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '18px',
        primaryTextColor: '#334155', lineColor: '#94a3b8',
        clusterBkg: '#ffffff', clusterBorder: '#cbd5e1',
      },
      flowchart: { htmlLabels: false, curve: 'linear', nodeSpacing: 24, rankSpacing: 32 },
    }));
    for (let level = 0; level <= 6; level++) {
      const input = join(temporary, `level-${level}.mmd`);
      const name = level === 0 ? 'a2-route-map.png' : `a2-route-map-level-${level}.png`;
      const output = fileURLToPath(new URL(`../../../docs/afternoon-2/assets/${name}`, import.meta.url));
      writeFileSync(input, diagramForLevel(level));
      const args = ['--no-install', '--package', '@mermaid-js/mermaid-cli@12.0.0',
        'mmdc', '-i', input, '-o', output, '-c', config, '-t', 'base',
        '-b', 'white', '--size', '2000', '-s', '2'];
      const result = process.platform === 'win32'
        ? spawnSync(process.env.ComSpec || 'cmd.exe',
          ['/d', '/s', '/c', `npx ${args.map(arg => /\s/.test(arg) ? `"${arg}"` : arg).join(' ')}`],
          { stdio: 'inherit', windowsVerbatimArguments: true })
        : spawnSync('npx', args, { stdio: 'inherit' });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(`Rendering level ${level} failed (${result.status})`);
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
