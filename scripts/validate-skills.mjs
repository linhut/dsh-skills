/**
 * dsh-skills 技能格式校验脚本
 *
 * 用法: node scripts/validate-skills.mjs
 *
 * 校验规则:
 * - 每个技能一个目录 skills/<name>/SKILL.md
 * - frontmatter 必填: name（kebab-case、与目录名一致）、description（非空）
 * - 正文非空
 * - 技能 name 全局唯一
 *
 * 存在任一问题时以非零退出码退出，可用于 CI 或提交钩子。
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../lib/frontmatter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', 'skills');

const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

if (!existsSync(SKILLS_DIR)) {
  console.error(`[validate] 找不到技能目录: ${SKILLS_DIR}`);
  process.exit(1);
}

const errors = [];
const rows = [];
const names = new Set();

for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true }).sort((a, b) =>
  a.name.localeCompare(b.name),
)) {
  if (!entry.isDirectory()) continue;
  const dir = entry.name;
  const skillPath = join(SKILLS_DIR, dir, 'SKILL.md');

  if (!existsSync(skillPath)) {
    errors.push(`${dir}: 缺少 SKILL.md`);
    rows.push({ dir, name: '—', status: `✗ 缺少 SKILL.md` });
    continue;
  }

  const content = readFileSync(skillPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  const name = frontmatter.name;
  const problems = [];

  if (!name) {
    problems.push('frontmatter 缺少 name');
  } else {
    if (!KEBAB_RE.test(name)) problems.push(`name "${name}" 不是 kebab-case`);
    if (name !== dir) problems.push(`name "${name}" 与目录名 "${dir}" 不一致`);
    if (names.has(name)) problems.push(`name "${name}" 重复`);
    names.add(name);
  }
  if (!frontmatter.description) problems.push('frontmatter 缺少 description');
  if (!body.trim()) problems.push('正文为空');

  rows.push({
    dir,
    name: name || '—',
    status: problems.length ? `✗ ${problems.join('; ')}` : '✓',
  });
  if (problems.length) errors.push(`${dir}: ${problems.join('; ')}`);
}

console.log('技能校验结果:');
for (const row of rows) {
  console.log(`  ${row.status.padEnd(24)} ${row.dir.padEnd(30)} ${row.name}`);
}
console.log(`\n共 ${rows.length} 个技能，${errors.length} 个问题`);
if (errors.length) {
  console.error('\n问题明细:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}