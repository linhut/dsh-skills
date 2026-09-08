# -*- coding: utf-8 -*-
"""抓取网页正文转纯文本/Markdown。"""
import sys, argparse, urllib.request, re, html
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8')

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = 0
        self._in_pre = False
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript', 'svg'):
            self.skip += 1
        if tag in ('p', 'div', 'br', 'li', 'h1', 'h2', 'h3', 'h4', 'tr', 'section', 'pre'):
            self.parts.append('\n')
        if tag == 'pre':
            self._in_pre = True
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript', 'svg'):
            self.skip = max(0, self.skip - 1)
        if tag in ('p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'tr', 'section', 'pre'):
            self.parts.append('\n')
        if tag == 'pre':
            self._in_pre = False
    def handle_data(self, data):
        if self.skip == 0:
            self.parts.append(data)

def fetch_text(url, max_chars=3000):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        raw = r.read()
    # 尝试多种编码
    for enc in ('utf-8', 'gb18030', 'latin-1'):
        try:
            body = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    p = TextExtractor()
    p.feed(body)
    text = ''.join(p.parts)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    text = html.unescape(text).strip()
    return text[:max_chars]

def main():
    ap = argparse.ArgumentParser(description='抓取网页正文')
    ap.add_argument('url', help='网页 URL')
    ap.add_argument('--max', type=int, default=3000, help='最大字符数')
    args = ap.parse_args()
    try:
        text = fetch_text(args.url, args.max)
        print(text if text else "(页面无正文内容)")
    except Exception as e:
        print("抓取失败:", e, file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
