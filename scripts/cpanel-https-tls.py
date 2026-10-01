#!/usr/bin/env python3
"""Verified TLS transport for cPanel HTTPS API (:2083)."""

from __future__ import annotations

import http.client
import socket
import ssl


class InsecureTlsError(ValueError):
    pass


def require_cpanel_hostname(value: str) -> str:
    hostname = (value or "").strip()
    if not hostname:
        raise InsecureTlsError("missing CPANEL_HOSTNAME for :2083 SNI")
    return hostname


def verified_https_context() -> ssl.SSLContext:
    context = ssl.create_default_context()
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    return context


class VerifiedCpanelHttpsConnection(http.client.HTTPSConnection):
    """Connect to host/IP while verifying the certificate against cPanel SNI."""

    def __init__(
        self,
        host: str,
        port: int,
        *,
        server_hostname: str,
        timeout: float = 300,
    ) -> None:
        self.server_hostname = require_cpanel_hostname(server_hostname)
        super().__init__(
            host,
            port,
            context=verified_https_context(),
            timeout=timeout,
        )

    def connect(self) -> None:
        self.sock = socket.create_connection(
            (self.host, self.port), self.timeout, self.source_address
        )
        self.sock = self._context.wrap_socket(
            self.sock,
            server_hostname=self.server_hostname,
        )
