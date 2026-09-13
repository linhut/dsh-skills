/**
 * SKILL.md frontmatter 解析（简单 YAML 子集）
 *
 * 支持的键值：`key: value`，值可为字符串 / true / false / 数字，可带引号。
 * 不支持：多行值、列表、嵌套对象、注释。
 * index.js（运行时注册）与 scripts/validate-skills.mjs（开发期校验）共用此实现，
 * 避免两处解析逻辑漂移。
 *
 * @param {string} content - SKILL.md 全文
 * @returns {{ frontmatter: Record<string, unknown>, body: string }}
 */
export function parseFrontmatter(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(content);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([a-z-]+):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    let value = kv[2].trim();
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (/^"?\d+"?$/.test(value)) value = Number(value.replace(/"/g, ''));
    else value = value.replace(/^["']|["']$/g, '');
    frontmatter[kv[1]] = value;
  }
  return { frontmatter, body: match[2].trim() };
}
