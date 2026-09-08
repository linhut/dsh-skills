# -*- coding: utf-8 -*-
"""DuckDuckGo lite 搜索：返回标题+URL+摘要。无需 API key。"""
import sys, argparse, urllib.request, urllib.parse, re, html, json, os
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode('utf-8', 'ignore')

def clean(s):
    s = re.sub(r'<[^>]+>', ' ', s)
    return html.unescape(re.sub(r'\s+', ' ', s)).strip()

def ddg_lite(q, n=8):
    """lite.duckduckgo.com 解析"""
    url = "https://lite.duckduckgo.com/lite/?q=" + urllib.parse.quote(q)
    body = fetch(url)
    results = []
    # lite 结构：<a rel="nofollow" href="//duckduckgo.com/l/?uddg=...">标题</a> ... <td class='result-snippet'>摘要</td>
    rows = re.split(r'<tr[^>]*>', body)[1:]
    for row in rows:
        m = re.search(r'<a rel="nofollow" href="([^"]+)"[^>]*>(.*?)</a>', row, re.S)
        if not m:
            continue
        href, title = m.group(1), clean(m.group(2))
        if not title:
            continue
        if href.startswith('//duckduckgo.com/l/?uddg='):
            real = urllib.parse.unquote(href.split('uddg=', 1)[1].split('&', 1)[0])
        else:
            real = href
        sm = re.search(r"class='result-snippet'>(.*?)</td>", row, re.S) or \
             re.search(r'class="result-snippet">(.*?)</td>', row, re.S)
        snippet = clean(sm.group(1)) if sm else ''
        results.append({"title": title, "url": real, "snippet": snippet})
        if len(results) >= n:
            break
    return results

def ddg_html(q, n=8):
    """html.duckduckgo.com 解析（备用）"""
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(q)
    body = fetch(url)
    results = []
    for m in re.finditer(r'<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)</a>', body, re.S):
        href, title = m.group(1), clean(m.group(2))
        if href.startswith('//duckduckgo.com/l/?uddg='):
            real = urllib.parse.unquote(href.split('uddg=', 1)[1].split('&', 1)[0])
        else:
            real = href
        snippet = ''
        sm = re.search(r'class="result__snippet"[^>]*>(.*?)</a>', body[body.find(title):], re.S)
        results.append({"title": title, "url": real, "snippet": snippet})
        if len(results) >= n:
            break
    return results

def main():
    ap = argparse.ArgumentParser(description='DuckDuckGo 搜索')
    ap.add_argument('query', help='搜索词')
    ap.add_argument('-n', type=int, default=8, help='结果条数（默认 8）')
    ap.add_argument('--save', action='store_true', help='保存结果到 results/')
    args = ap.parse_args()

    try:
        results = ddg_lite(args.query, args.n)
        if not results:
            results = ddg_html(args.query, args.n)
    except Exception as e:
        print("搜索失败:", e, file=sys.stderr)
        sys.exit(1)

    if not results:
        print("无结果")
        sys.exit(0)

    for i, r in enumerate(results, 1):
        print("[%d] %s" % (i, r["title"]))
        print("    URL: %s" % r["url"])
        if r["snippet"]:
            print("    %s" % r["snippet"][:160])
        print()

    if args.save:
        os.makedirs('results', exist_ok=True)
        fname = 'results/search_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.md'
        with open(fname, 'w', encoding='utf-8') as f:
            f.write("# 搜索结果: %s\n\n" % args.query)
            for r in results:
                f.write("## %s\n%s\n\n%s\n\n" % (r["title"], r["url"], r["snippet"]))
        print("已保存: %s" % fname)

if __name__ == '__main__':
    main()
