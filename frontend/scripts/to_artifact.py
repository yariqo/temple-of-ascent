"""Turn dist-demo/index.html (full document) into an Artifact page body (no doctype/html/head/body)."""
import re, sys
src = open("dist-demo/index.html", encoding="utf-8").read()
head = src.split("<body>", 1)[0]
body = src.split("<body>", 1)[1].rsplit("</body>", 1)[0]
title = re.search(r"<title>.*?</title>", head, re.S).group(0)
styles = re.findall(r"<style[^>]*>.*?</style>", head, re.S)
scripts = re.findall(r"<script[^>]*>.*?</script>", head, re.S)
out = "\n".join([title, *styles, body, *scripts])
open(sys.argv[1], "w", encoding="utf-8").write(out)
print(len(out) // 1024, "KB", len(styles), "styles", len(scripts), "scripts")
