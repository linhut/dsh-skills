/**
 * dsh-skills - DSH 插件入口
 *
 * 将 skills/ 目录下的技能逐个注册到 ctx.skills，
 * 使 DSH 会话目录中出现这些技能，模型可通过内置 skill({ name }) 工具加载。
 *
 * 兼容 dsh-superpowers 模式：apply 时注册、dispose 时释放。
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, 'skills');

/**
 * 读取 skills/ 下所有技能定义
 * @returns {Array<{name: string, description: string, body: string}>}
 */
function collectSkills() {
  const skills = [];
  if (!existsSync(SKILLS_DIR)) return skills;

  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(SKILLS_DIR, entry.name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    const content = readFileSync(skillPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter.name) {
      console.warn(`[dsh-skills] 跳过缺失 name 的技能: ${entry.name}`);
      continue;
    }

    skills.push({
      name: frontmatter.name,
      description: frontmatter.description || '',
      body,
      disableModelInvocation: frontmatter['disable-model-invocation'] === true,
      userInvocable: frontmatter['user-invocable'] !== false,
    });
  }

  // 按名称排序，保证注册顺序跨平台确定
  skills.sort((a, b) => a.name.localeCompare(b.name));

  // 重名告警：后注册者会覆盖先注册者
  const seen = new Set();
  for (const skill of skills) {
    if (seen.has(skill.name)) {
      console.warn(`[dsh-skills] 检测到重名技能: ${skill.name}，后注册者将覆盖先注册者`);
    }
    seen.add(skill.name);
  }

  return skills;
}

/**
 * DSH bundle apply 入口
 * @param {object} ctx - Cordis 上下文
 */
export function apply(ctx) {
  const disposers = [];

  for (const skill of collectSkills()) {
    try {
      const dispose = ctx.skills.register({
        name: skill.name,
        description: skill.description,
        body: skill.body,
        modelInvocable: !skill.disableModelInvocation,
        userInvocable: skill.userInvocable,
      });
      disposers.push(dispose);
      console.log(`[dsh-skills] 已注册技能: ${skill.name}`);
    } catch (error) {
      console.warn(`[dsh-skills] 技能注册失败 ${skill.name}: ${error.message}`);
    }
  }

  // 组合 disposer：释放本插件注册的全部技能
  return () => {
    for (const dispose of disposers) {
      try { dispose(); } catch {}
    }
  };
}
