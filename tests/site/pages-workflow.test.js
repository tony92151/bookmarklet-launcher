import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const PRIVACY_POLICY_URL =
  'https://tony92151.github.io/bookmarklet-launcher/site/privacy.html';

test('Pages workflow publishes site, shared module, and bookmarklet catalog', async () => {
  const workflow = await readFile('.github/workflows/deploy-pages.yml', 'utf8');

  assert.match(workflow, /cp -R site shared bookmarklets dist/);
  assert.match(workflow, /actions\/upload-pages-artifact/);
  assert.match(workflow, /actions\/deploy-pages/);
});

test('Pages assembly deploys the privacy policy under site/privacy.html', async (t) => {
  const workflow = await readFile('.github/workflows/deploy-pages.yml', 'utf8');
  const assemblyBlock = workflow.match(
    /- name: Assemble Pages artifact\n\s+run: \|\n((?: {10}.+(?:\n|$))+)/,
  );
  assert.ok(assemblyBlock, 'Pages workflow must define an assembly command');

  const projectDirectory = await mkdtemp(join(tmpdir(), 'pages-layout-'));
  t.after(() => rm(projectDirectory, { force: true, recursive: true }));
  for (const path of ['site', 'shared', 'bookmarklets']) {
    await cp(path, join(projectDirectory, path), { recursive: true });
  }

  const command = assemblyBlock[1]
    .split('\n')
    .map((line) => line.slice(10))
    .join('\n');
  await execFile('/bin/sh', ['-eu', '-c', command], { cwd: projectDirectory });

  assert.equal(
    (await stat(join(projectDirectory, 'dist', 'site', 'privacy.html'))).isFile(),
    true,
  );
});

test('release checklist uses the privacy URL produced by the Pages layout', async () => {
  const checklist = await readFile(
    'docs/chrome-web-store-release-checklist.md',
    'utf8',
  );

  assert.ok(checklist.includes(`\`${PRIVACY_POLICY_URL}\``));
});
