"""Fetch a notice's attachment through the authenticated ERP session -- the
attachment lives on the same host as the notice list and isn't reachable
without the login session's cookies."""

from scraper.login import ERPSession


def download(session: ERPSession, url: str) -> bytes:
    return session.get(url).content
