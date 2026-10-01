#!/usr/bin/env python3
"""Publish ./dist to cPanel through verified HTTPS API :2083."""

from __future__ import annotations

import importlib.util
import json
import os
import re
import ssl
import sys
import tempfile
import time
import urllib.parse
import zipfile
from pathlib import Path


TLS_PATH = Path(__file__).with_name("cpanel-https-tls.py")
TLS_SPEC = importlib.util.spec_from_file_location("cpanel_https_tls", TLS_PATH)
if TLS_SPEC is None or TLS_SPEC.loader is None:
    raise SystemExit("cannot load cpanel-https-tls.py")
TLS = importlib.util.module_from_spec(TLS_SPEC)
TLS_SPEC.loader.exec_module(TLS)


def required(name: str) -> str:
    value = os.environ.get(name, "").strip().strip("'").strip('"')
    if not value:
        raise SystemExit(f"missing env {name}")
    return value


def api_json(
    host: str,
    hostname: str,
    path_and_query: str,
    auth: str,
    data: bytes | None = None,
    content_type: str | None = None,
    retries: int = 1,
) -> dict:
    """Call cPanel API, retrying only bounded TLS/network failures."""
    method = "POST" if data is not None else "GET"
    for attempt in range(retries):
        conn = None
        try:
            conn = TLS.VerifiedCpanelHttpsConnection(
                host, 2083, server_hostname=hostname, timeout=300
            )
            conn._http_vsn = 11
            conn._http_vsn_str = "HTTP/1.1"
            headers = {"Authorization": auth, "Host": hostname}
            if content_type:
                headers["Content-Type"] = content_type
            conn.request(method, path_and_query, body=data, headers=headers)
            response = conn.getresponse()
            body = response.read()
            if response.status >= 400:
                raise SystemExit(f"HTTP {response.status}: {body[:500]!r}")
            return json.loads(body.decode("utf-8"))
        except (ssl.SSLError, ConnectionResetError, BrokenPipeError) as error:
            if attempt == retries - 1:
                raise SystemExit(
                    f"cPanel HTTPS transport failed after {retries} attempt(s): "
                    f"{type(error).__name__}: {error}"
                ) from error
            time.sleep(2**attempt)
        finally:
            if conn is not None:
                conn.close()
    raise SystemExit("unreachable")


def zip_dist(dist: Path, zip_path: Path) -> None:
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in dist.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(dist).as_posix())


def main() -> None:
    host = required("CPANEL_HOST")
    hostname = required("CPANEL_HOSTNAME")
    user = required("CPANEL_USER")
    token = required("CPANEL_API_TOKEN")
    rel_dir = required("CPANEL_DIR").strip("/")
    dist = Path("dist")
    if not (dist / "index.html").is_file():
        raise SystemExit("dist/index.html not found — run build first")

    auth = f"cpanel {user}:{token}"
    absolute_dir = f"/home/{user}/{rel_dir}"

    def fileop(operation: str, source: str, destination: str | None = None) -> dict:
        params = {
            "cpanel_jsonapi_user": user,
            "cpanel_jsonapi_apiversion": 2,
            "cpanel_jsonapi_module": "Fileman",
            "cpanel_jsonapi_func": "fileop",
            "op": operation,
            "sourcefiles": source,
            "doubledecode": 1,
        }
        if destination is not None:
            params["destfiles"] = destination
        return api_json(
            host,
            hostname,
            "/json-api/cpanel?" + urllib.parse.urlencode(params),
            auth,
        )

    print(f"target https://{host}:2083 Host={hostname} dir={rel_dir}")
    print("preflight: UAPI Fileman/list_files")
    listing = api_json(
        host,
        hostname,
        "/execute/Fileman/list_files?" + urllib.parse.urlencode({"dir": rel_dir}),
        auth,
    )
    if listing.get("status") != 1:
        raise SystemExit("preflight list_files denied or returned an invalid result")
    print("preflight ok")

    commit = re.sub(r"[^A-Za-z0-9_.-]", "-", os.environ.get("GITHUB_SHA", "local"))[:40]
    archive_name = f"deploy-{commit}.zip"
    archive_absolute_path = f"{absolute_dir}/{archive_name}"

    with tempfile.TemporaryDirectory() as temporary:
        archive_path = Path(temporary) / archive_name
        zip_dist(dist, archive_path)
        boundary = "----PrintSalaDeploy"
        raw = archive_path.read_bytes()
        multipart = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file-1"; filename="{archive_name}"\r\n'
            "Content-Type: application/zip\r\n\r\n"
        ).encode() + raw + f"\r\n--{boundary}--\r\n".encode()
        uploaded = api_json(
            host,
            hostname,
            "/execute/Fileman/upload_files?"
            + urllib.parse.urlencode({"dir": rel_dir}),
            auth,
            data=multipart,
            content_type=f"multipart/form-data; boundary={boundary}",
            retries=2,
        )
        if uploaded.get("status") != 1:
            raise SystemExit("upload failed: cPanel returned a non-success result")
        print("upload ok")

        extracted = fileop("extract", archive_absolute_path, absolute_dir)
        if extracted.get("cpanelresult", {}).get("event", {}).get("result") != 1:
            raise SystemExit("extract failed: cPanel returned a non-success result")
        print("extract ok")

        try:
            fileop("unlink", archive_absolute_path)
        except SystemExit as error:
            print(f"cleanup warning: {error}")
        print("deploy done")


if __name__ == "__main__":
    main()
