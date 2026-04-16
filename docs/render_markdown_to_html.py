from __future__ import annotations

import html
import base64
import mimetypes
import re
import sys
from urllib.parse import unquote
from pathlib import Path

import markdown


def windows_path_to_file_uri(raw: str) -> str:
    normalized = raw.replace("\\", "/")
    return "file:///" + normalized


def rewrite_windows_targets(md_text: str) -> str:
    pattern = re.compile(r"(!?\[[^\]]*\]\()([A-Za-z]:/[^)\s]+)(\))")
    return pattern.sub(lambda m: f"{m.group(1)}{windows_path_to_file_uri(m.group(2))}{m.group(3)}", md_text)


def build_html(body: str, title: str) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{html.escape(title)}</title>
  <style>
    @page {{
      size: A4;
      margin: 18mm 14mm;
    }}
    body {{
      font-family: "Segoe UI", Arial, sans-serif;
      color: #1f2937;
      line-height: 1.45;
      font-size: 12px;
    }}
    h1, h2, h3, h4 {{
      color: #0f172a;
      page-break-after: avoid;
    }}
    h1 {{
      font-size: 24px;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 8px;
    }}
    h2 {{
      font-size: 18px;
      margin-top: 22px;
    }}
    h3 {{
      font-size: 14px;
      margin-top: 16px;
    }}
    table {{
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0 16px;
      page-break-inside: avoid;
    }}
    th, td {{
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      vertical-align: top;
      text-align: left;
    }}
    th {{
      background: #e2e8f0;
    }}
    code {{
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      font-family: Consolas, monospace;
      word-break: break-word;
    }}
    pre {{
      background: #f8fafc;
      color: #111827;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }}
    pre code {{
      background: transparent;
      color: inherit;
      padding: 0;
      border-radius: 0;
    }}
    img {{
      max-width: 100%;
      height: auto;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin: 10px 0 18px;
      page-break-inside: avoid;
    }}
    blockquote {{
      border-left: 4px solid #94a3b8;
      margin-left: 0;
      padding-left: 12px;
      color: #475569;
    }}
    ul, ol {{
      padding-left: 20px;
    }}
    p {{
      margin: 8px 0;
    }}
  </style>
</head>
<body>
{body}
</body>
</html>
"""


def embed_local_images(html_body: str) -> str:
    pattern = re.compile(r'(<img\b[^>]*\bsrc=")(file:///[^"]+)(")', re.IGNORECASE)

    def replace(match: re.Match[str]) -> str:
        raw_uri = match.group(2)
        local_path = unquote(raw_uri.removeprefix("file:///"))
        path = Path(local_path)
        if not path.exists():
            return match.group(0)

        mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        encoded = base64.b64encode(path.read_bytes()).decode("ascii")
        return f'{match.group(1)}data:{mime_type};base64,{encoded}{match.group(3)}'

    return pattern.sub(replace, html_body)


def main() -> int:
    if len(sys.argv) != 3:
      print("Usage: python render_markdown_to_html.py <input.md> <output.html>")
      return 1

    input_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()

    md_text = input_path.read_text(encoding="utf-8")
    md_text = rewrite_windows_targets(md_text)

    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "sane_lists"],
        output_format="html5",
    )
    html_body = embed_local_images(html_body)
    title = input_path.stem.replace("_", " ")
    output_path.write_text(build_html(html_body, title), encoding="utf-8")
    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
