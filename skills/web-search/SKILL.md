---
name: web-search
description: 联网搜索工具。当需要获取最新信息、查找资料、调研网页、确认事实、寻找开源项目或任何超出本地知识的内容时使用。基于 DuckDuckGo 免费端点，无需 API key，开箱即用。提供 search（搜索返回标题+URL+摘要）与 fetch（抓取网页正文转 Markdown）两个命令。
disable-model-invocation: false
user-invocable: true
---

# Web Search（联网搜索）

零配置联网搜索 skill：无需任何 API key，直接可用的搜索引擎封装。

## 何时使用

- 用户询问最新信息、时事、文档、API 用法
- 需要查找开源项目、仓库、skill
- 需要调研网页内容、提取正文
- 任何需要互联网资料的场景

## 命令

### 1. 搜索

```bash
py -3 scripts/search.py "你的查询词" [-n 10] [--save]
```

- `-n`：返回结果条数（默认 8）
- `--save`：同时保存结果到 `results/` 目录（Markdown 文件）
- 输出格式：每行一条「标题 | URL」，随后给出摘要

### 2. 抓取网页正文

```bash
py -3 scripts/fetch.py "https://example.com/page" [--max 3000]
```

- 抓取网页正文并转为纯文本/Markdown
- `--max`：最大字符数（默认 3000）
- 适用于深度调研：先 search 拿 URL，再 fetch 读全文

## 使用示例

```bash
# 搜索
py -3 scripts/search.py "python-pptx 中文字体设置" -n 5

# 搜索并保存结果
py -3 scripts/search.py "best PPT generation skill github" --save

# 读取某个结果的完整内容
py -3 scripts/fetch.py "https://github.com/AndersonBY/pptx-ea-font" --max 4000
```

## 注意事项

- 搜索基于 DuckDuckGo，结果可能不如 Google/Bing 全，但足够日常使用
- 无外网时命令会报错（网络不可达）
- 遵守 robots 协议，抓取频率不要过高
