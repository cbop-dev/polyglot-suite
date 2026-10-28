#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// Tag format style: 'dot' (e.g. bible.v0.2.33) or 'dash' (e.g. bible-v0.2.33)
const TAG_STYLE = 'dot';

const TARGETS = {
  suite: { name: 'polyglot-suite', file: 'package.json', tagPrefix: 'suite' },
  bible: { name: 'polyglot-bible-reader', file: 'apps/polyglot-bible-reader/package.json', tagPrefix: 'bible' },
  philo: { name: 'philo-reader', file: 'apps/philo-reader/package.json', tagPrefix: 'philo' },
  lex: { name: 'biblical-lexeme-explorer', file: 'apps/biblical-lexeme-explorer/package.json', tagPrefix: 'lex' },
  lexeme: { name: 'biblical-lexeme-explorer', file: 'apps/biblical-lexeme-explorer/package.json', tagPrefix: 'lex' },
  fathers: { name: 'apostolic-fathers-reader', file: 'apps/apostolic-fathers-reader/package.json', tagPrefix: 'af' },
  af: { name: 'apostolic-fathers-reader', file: 'apps/apostolic-fathers-reader/package.json', tagPrefix: 'af' },
  josephus: { name: 'josephus-reader', file: 'apps/josephus-reader/package.json', tagPrefix: 'josephus' },
  ui: { name: '@polyglot/ui', file: 'packages/ui/package.json', tagPrefix: 'ui' },
  theme: { name: '@polyglot/theme', file: 'packages/theme/package.json', tagPrefix: 'theme' },
  'db-vfs': { name: '@polyglot/db-vfs', file: 'packages/db-vfs/package.json', tagPrefix: 'db-vfs' },
  languages: { name: '@polyglot/ancient-languages', file: 'packages/ancient-languages/package.json', tagPrefix: 'languages' },
  morphology: { name: '@polyglot/greek-morphology', file: 'packages/greek-morphology/package.json', tagPrefix: 'morphology' },
  'greek-morphology': { name: '@polyglot/greek-morphology', file: 'packages/greek-morphology/package.json', tagPrefix: 'morphology' },
  'lemma-ui': { name: '@polyglot/lemma-ui', file: 'packages/lemma-ui/package.json', tagPrefix: 'lemma-ui' },
  pipeline: { name: '@polyglot/pipeline-core', file: 'packages/pipeline-core/package.json', tagPrefix: 'pipeline' },
  'data-pipeline': { name: '@polyglot/data-pipeline', file: 'packages/data-pipeline/package.json', tagPrefix: 'data-pipeline' },
  'biblical-data': { name: '@biblical-data/corpora', file: 'packages/biblical-data/package.json', tagPrefix: 'biblical-data' },
};

function formatTag(prefix, version) {
  const sep = TAG_STYLE === 'dash' ? '-v' : '.v';
  return `${prefix}${sep}${version}`;
}

function run(cmd, { dryRun = false } = {}) {
  if (dryRun) {
    console.log(`[dry-run] ${cmd}`);
    return '';
  }
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf-8' }).trim();
}

function bumpSemver(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver: "${version}"`);
  }
  let [major, minor, patch] = parts;
  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else if (type === 'patch') {
    patch += 1;
  } else if (/^\d+\.\d+\.\d+$/.test(type)) {
    return type;
  } else {
    throw new Error(`Unknown bump type: "${type}". Expected "major", "minor", "patch", or an explicit version like "1.2.3"`);
  }
  return `${major}.${minor}.${patch}`;
}

function readPkgWithIndent(filePath) {
  const fullPath = path.join(REPO_ROOT, filePath);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const indentMatch = raw.match(/^[ \t]+/m);
  const indent = indentMatch ? indentMatch[0] : 2;
  return { pkg: JSON.parse(raw), indent };
}

function writePkg(filePath, data, indent, dryRun = false) {
  const fullPath = path.join(REPO_ROOT, filePath);
  if (dryRun) {
    console.log(`[dry-run] Update ${filePath} version to ${data.version}`);
    return;
  }
  fs.writeFileSync(fullPath, JSON.stringify(data, null, indent) + '\n', 'utf-8');
}

function updateLockfiles(targetKey, newVer, dryRun = false) {
  const rootLockPath = path.join(REPO_ROOT, 'package-lock.json');
  if (fs.existsSync(rootLockPath)) {
    const { pkg: lock, indent } = readPkgWithIndent('package-lock.json');
    let modified = false;

    if (targetKey === 'suite') {
      if (lock.version !== newVer) {
        lock.version = newVer;
        modified = true;
      }
      if (lock.packages && lock.packages[''] && lock.packages[''].version !== newVer) {
        lock.packages[''].version = newVer;
        modified = true;
      }
    } else {
      const target = TARGETS[targetKey];
      const targetDir = path.dirname(target.file);
      if (lock.packages && lock.packages[targetDir] && lock.packages[targetDir].version !== newVer) {
        lock.packages[targetDir].version = newVer;
        modified = true;
      }
    }

    if (modified) {
      console.log(`🔒 Synchronized root package-lock.json for ${targetKey} -> ${newVer}`);
      writePkg('package-lock.json', lock, indent, dryRun);
    }
  }

  // Also check local package-lock.json in sub-app directory if present
  const target = TARGETS[targetKey];
  if (target && target.file !== 'package.json') {
    const localLock = path.join(path.dirname(target.file), 'package-lock.json');
    if (fs.existsSync(path.join(REPO_ROOT, localLock))) {
      const { pkg: lock, indent } = readPkgWithIndent(localLock);
      lock.version = newVer;
      if (lock.packages && lock.packages['']) {
        lock.packages[''].version = newVer;
      }
      writePkg(localLock, lock, indent, dryRun);
    }
  }
}

// 1. Granular Bump: bump target package.json
export function bumpTarget(targetKey, bumpType = 'patch', { dryRun = false } = {}) {
  const target = TARGETS[targetKey];
  if (!target) {
    throw new Error(`Target "${targetKey}" not found. Available targets: ${Object.keys(TARGETS).join(', ')}`);
  }

  const { pkg, indent } = readPkgWithIndent(target.file);
  const oldVer = pkg.version;
  const newVer = bumpSemver(oldVer, bumpType);

  console.log(`📦 Bumping ${target.name} (${target.file}): ${oldVer} -> ${newVer} [${bumpType}]`);
  pkg.version = newVer;
  writePkg(target.file, pkg, indent, dryRun);

  // Keep package-lock.json in exact sync
  updateLockfiles(targetKey, newVer, dryRun);

  return {
    targetKey,
    file: target.file,
    oldVersion: oldVer,
    version: newVer,
    tag: formatTag(target.tagPrefix, newVer),
  };
}

// 2. Discover package versions modified compared to git HEAD
export function getChangedPackageTags() {
  const changed = [];
  const checkedFiles = new Set();

  for (const [key, target] of Object.entries(TARGETS)) {
    if (checkedFiles.has(target.file)) continue;
    checkedFiles.add(target.file);

    try {
      const headContent = execSync(`git show HEAD:${target.file}`, {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const headPkg = JSON.parse(headContent);
      const { pkg: currentPkg } = readPkgWithIndent(target.file);

      if (headPkg.version !== currentPkg.version) {
        changed.push({
          targetKey: key,
          file: target.file,
          oldVersion: headPkg.version,
          version: currentPkg.version,
          tag: formatTag(target.tagPrefix, currentPkg.version),
        });
      }
    } catch {
      // If git show fails (e.g. untracked file), skip
    }
  }
  return changed;
}

// 3. Commit and Tag
export function commitAndTag(message, { dryRun = false, push = false, stageAll = false, simulatedChanges = null } = {}) {
  const changed = (dryRun && simulatedChanges) ? simulatedChanges : getChangedPackageTags();

  if (changed.length === 0) {
    console.log('ℹ️  No package.json version changes detected relative to HEAD.');
    return;
  }

  console.log(`\n🔍 Version changes to commit and tag:`);
  for (const item of changed) {
    console.log(`   - ${item.file}: ${item.oldVersion} -> ${item.version} (Tag: ${item.tag})`);
  }

  // Check if any tag already exists in Git
  let existingTags = [];
  try {
    existingTags = execSync('git tag', { cwd: REPO_ROOT, encoding: 'utf-8' }).split('\n').map(t => t.trim());
  } catch {
    // ignore
  }

  for (const item of changed) {
    if (existingTags.includes(item.tag)) {
      throw new Error(`Git tag "${item.tag}" already exists! Aborting.`);
    }
  }

  // Stage files: package.json files PLUS package-lock.json files
  if (stageAll) {
    run('git add -A', { dryRun });
  } else {
    const filesToStage = changed.map(c => c.file);
    const lockCandidates = [
      'package-lock.json',
      'apps/polyglot-bible-reader/package-lock.json',
      'apps/josephus-reader/package-lock.json',
      'apps/josephus-reader/app/package-lock.json',
      'apps/philo-reader/package-lock.json',
      'apps/apostolic-fathers-reader/package-lock.json',
      'apps/biblical-lexeme-explorer/package-lock.json'
    ];
    for (const lf of lockCandidates) {
      if (fs.existsSync(path.join(REPO_ROOT, lf))) {
        filesToStage.push(lf);
      }
    }
    run(`git add ${filesToStage.join(' ')}`, { dryRun });
  }

  // Generate commit message if not provided
  const defaultMsg = changed.map(c => `${c.targetKey} v${c.version}`).join(', ');
  const commitMsg = message ? message : `release: ${defaultMsg}`;

  // Commit
  run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { dryRun });
  console.log(`\n✅ Committed: "${commitMsg}"`);

  // Create annotated tags
  for (const item of changed) {
    run(`git tag -a ${item.tag} -m "${item.tag}"`, { dryRun });
    console.log(`🏷️  Created tag: ${item.tag}`);
  }

  // Push if requested
  if (push) {
    console.log('\n🚀 Pushing commit and tags to remote...');
    run('git push && git push --follow-tags', { dryRun });
    console.log('✨ Remote push complete.');
  } else {
    console.log('\n💡 To push to remote: git push && git push --follow-tags');
  }
}
function isBumpType(str) {
  return (
    ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'].includes(str) ||
    /^\d+\.\d+\.\d+$/.test(str)
  );
}

function parseTargetSpecs(rawTargetArgs) {
  if (!rawTargetArgs || rawTargetArgs.length === 0) {
    return [];
  }

  const args = [...rawTargetArgs];
  let defaultBump = 'patch';

  // If the last argument is a bump type keyword, extract it as the default bump for all specified targets
  if (args.length > 1 && isBumpType(args[args.length - 1])) {
    defaultBump = args.pop();
  } else if (args.length === 1 && isBumpType(args[0])) {
    return [];
  }

  const rawSpecs = [];
  for (const arg of args) {
    // Handle comma-separated targets: e.g. "bible,lex" or "bible:minor,lex:patch"
    const parts = arg.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes(':')) {
        const [target, type] = part.split(':').map(s => s.trim());
        rawSpecs.push({ target, type: type || defaultBump });
      } else {
        rawSpecs.push({ target: part, type: defaultBump });
      }
    }
  }

  // Deduplicate by target name, preserving order
  const targetMap = new Map();
  for (const spec of rawSpecs) {
    targetMap.set(spec.target, spec.type);
  }

  return Array.from(targetMap.entries()).map(([target, type]) => ({ target, type }));
}

function printUsage(errorMessage = null) {
  if (errorMessage) {
    console.error(`\n❌ Error: ${errorMessage}\n`);
  }

  // Load current versions dynamically to display helpful table
  const targetRows = [];
  const seenFiles = new Set();
  for (const [key, t] of Object.entries(TARGETS)) {
    if (seenFiles.has(t.file)) continue;
    seenFiles.add(t.file);
    try {
      const { pkg } = readPkgWithIndent(t.file);
      targetRows.push(`  ${key.padEnd(16)} ${pkg.name.padEnd(30)} (v${pkg.version})`);
    } catch {
      targetRows.push(`  ${key.padEnd(16)} ${t.name.padEnd(30)}`);
    }
  }

  console.log(`Polyglot Monorepo Release Tool

Usage:
  npm run release <app1> [app2...] [bump-type] [-m "message"] [-a] [--push] [--dry-run]
  npm run version:bump <app1> [app2...] [bump-type] [--dry-run]
  npm run version:tag [-m "message"] [-a] [--push] [--dry-run]

Arguments:
  <app...>       One or more targets to release (space- or comma-separated)
                 Can also specify individual bump types like "bible:minor lex:patch"
  [bump-type]    patch | minor | major | explicit (e.g. 1.2.3) [default: patch]

Flags:
  -m "message"   Custom Git commit message (default: "release: <app> vX.Y.Z, suite vX.Y.Z")
  -a, --all      Stage all modified files in repository before committing
  --push         Push commit and newly created annotated tags to remote
  --dry-run      Preview actions without modifying files or git refs
  -h, --help     Show this help guide

Available Targets & Current Versions:
${targetRows.join('\n')}

Examples:
  npm run release bible                          # Single app: bumps bible (patch) & suite (patch)
  npm run release bible lex                      # Multiple apps: bumps bible, lex, and suite (patch) ONCE
  npm run release bible lex minor                # Multiple apps: bumps bible (minor), lex (minor), suite (patch)
  npm run release bible:minor lex:patch          # Individual bump types for each app
  npm run release -- bible lex -m "Sync UI"      # Multiple apps with custom commit message
  npm run release -- bible,lex --push            # Comma-separated targets and auto-push
  npm run version:bump bible lex                 # Granular: bump bible and lex without committing
  npm run version:tag -m "Release notes"         # Granular: commit & tag changed packages
`);
  process.exit(errorMessage ? 1 : 0);
}

// 4. CLI Argument Parsing
function parseArgs() {
  const rawArgs = process.argv.slice(2);

  const isHelp =
    rawArgs.includes('-h') ||
    rawArgs.includes('--help') ||
    rawArgs.includes('help');

  const flags = {
    dryRun: rawArgs.includes('--dry-run') || process.env.npm_config_dry_run === 'true',
    push: rawArgs.includes('--push') || process.env.npm_config_push === 'true',
    stageAll: rawArgs.includes('-a') || rawArgs.includes('--all') || process.env.npm_config_all === 'true',
    help: isHelp,
  };

  let message = process.env.npm_config_message || undefined;
  const mIdx = rawArgs.findIndex(a => a === '-m' || a === '--message');
  if (mIdx !== -1 && rawArgs[mIdx + 1]) {
    message = rawArgs[mIdx + 1];
  }

  // Positional arguments
  const positionals = [];
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a.startsWith('--') || a === '-a') continue;
    if (a === '-m') {
      i++; // skip message text
      continue;
    }
    positionals.push(a);
  }

  return { command: positionals[0], positionals, flags, message };
}

// Main Runner
const { command, positionals, flags, message } = parseArgs();

if (flags.help || command === 'help') {
  printUsage();
}

if (!command) {
  printUsage();
}

if (command === 'bump') {
  // Usage: node scripts/release.js bump <target1> [target2...] [patch|minor|major]
  const specs = parseTargetSpecs(positionals.slice(1));
  if (specs.length === 0) {
    printUsage('Target app or package required for bump command (e.g. npm run version:bump bible lex).');
  }

  for (const { target, type } of specs) {
    if (!TARGETS[target]) {
      printUsage(`Target "${target}" not found. Available targets: ${Object.keys(TARGETS).join(', ')}`);
    }
    if (!isBumpType(type)) {
      printUsage(`Invalid bump type "${type}" for target "${target}". Expected major, minor, patch, or x.y.z.`);
    }
  }

  for (const { target, type } of specs) {
    bumpTarget(target, type, { dryRun: flags.dryRun });
  }
} else if (command === 'tag' || command === 'commit') {
  // Usage: node scripts/release.js tag [-m "message"] [--push] [-a]
  commitAndTag(message, { dryRun: flags.dryRun, push: flags.push, stageAll: flags.stageAll });
} else if (command === 'release') {
  // Usage: node scripts/release.js release <app1> [app2...] [major|minor|patch] [-m "message"] [--push] [-a]
  const specs = parseTargetSpecs(positionals.slice(1));

  if (specs.length === 0) {
    printUsage('Please specify at least one app or package to release (e.g. npm run release bible lex).');
  }

  for (const { target, type } of specs) {
    if (!TARGETS[target]) {
      printUsage(`Target "${target}" not found. Available targets: ${Object.keys(TARGETS).join(', ')}`);
    }
    if (!isBumpType(type)) {
      printUsage(`Invalid bump type "${type}" for target "${target}". Expected major, minor, patch, or x.y.z.`);
    }
  }

  // If suite is not explicitly in the list of targets, include suite once (defaulting to patch)
  const hasSuite = specs.some(s => s.target === 'suite');
  if (!hasSuite) {
    specs.push({ target: 'suite', type: 'patch' });
  }

  // 1. Bump all targets
  const changes = [];
  for (const { target, type } of specs) {
    const change = bumpTarget(target, type, { dryRun: flags.dryRun });
    changes.push(change);
  }

  // 2. Commit & Tag
  commitAndTag(message, {
    dryRun: flags.dryRun,
    push: flags.push,
    stageAll: flags.stageAll,
    simulatedChanges: changes,
  });
} else {
  printUsage(`Unknown command "${command}".`);
}
