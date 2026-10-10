from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


class PreviewHandler(SimpleHTTPRequestHandler):
    def guess_type(self, path):
        filename = urlsplit(path).path.rsplit("/", 1)[-1]
        if filename == "preview" or (
            filename.startswith("preview(") and filename.endswith(")")
        ):
            return "image/webp"
        return super().guess_type(path)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 5000), PreviewHandler).serve_forever()
