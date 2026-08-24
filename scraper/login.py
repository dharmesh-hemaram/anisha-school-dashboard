"""
Authenticated session against the SNBP Wagholi ERP (ASP.NET WebForms).

Login form (as of 2026-08-24) is a plain POST to LoginPage.aspx with the
standard WebForms hidden fields (__VIEWSTATE, __VIEWSTATEGENERATOR,
__EVENTVALIDATION) plus txtUserName / txtPassword / submit. No client-side
JS or CAPTCHA on the login page, so a plain requests.Session works — no
Playwright needed for this step.
"""

import logging
import os

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

LOGIN_PATH = "/LoginPage.aspx"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)


class ERPLoginError(RuntimeError):
    """Raised when authentication against the ERP fails."""


class ERPSession:
    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})

    def _extract_form_fields(self, html: str) -> dict:
        soup = BeautifulSoup(html, "lxml")
        form = soup.find("form")
        if form is None:
            raise ERPLoginError("Login page did not return a <form> — site structure may have changed")
        fields = {}
        for inp in form.find_all("input"):
            name = inp.get("name")
            if name:
                fields[name] = inp.get("value", "")
        return fields

    def login(self) -> None:
        login_url = f"{self.base_url}{LOGIN_PATH}"
        resp = self.session.get(login_url, timeout=20)
        resp.raise_for_status()

        fields = self._extract_form_fields(resp.text)
        if "txtUserName" not in fields or "txtPassword" not in fields:
            raise ERPLoginError("Expected login fields (txtUserName/txtPassword) not found on login page")

        fields["txtUserName"] = self.username
        fields["txtPassword"] = self.password

        resp = self.session.post(login_url, data=fields, timeout=20)
        resp.raise_for_status()

        if self._is_login_page(resp.text):
            raise ERPLoginError("Login rejected by ERP — check ERP_USERNAME/ERP_PASSWORD")

        logger.info("ERP login succeeded for user %s", self.username)

    @staticmethod
    def _is_login_page(html: str) -> bool:
        return "txtUserName" in html and "txtPassword" in html

    def get(self, path: str, **kwargs) -> requests.Response:
        """GET a page, transparently re-logging in once if the session expired."""
        url = path if path.startswith("http") else f"{self.base_url}{path}"
        resp = self.session.get(url, timeout=20, **kwargs)
        resp.raise_for_status()
        if self._is_login_page(resp.text):
            logger.warning("Session expired mid-run, re-authenticating")
            self.login()
            resp = self.session.get(url, timeout=20, **kwargs)
            resp.raise_for_status()
            if self._is_login_page(resp.text):
                raise ERPLoginError(f"Still redirected to login after re-auth when fetching {url}")
        return resp


def build_session_from_env() -> ERPSession:
    base_url = os.environ["ERP_BASE_URL"]
    username = os.environ["ERP_USERNAME"]
    password = os.environ["ERP_PASSWORD"]
    return ERPSession(base_url, username, password)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    from dotenv import load_dotenv

    load_dotenv()
    session = build_session_from_env()
    session.login()
    print("Login OK. Session cookies:", list(session.session.cookies.keys()))
