"""
Fetch the notice list from StudentModule/SchoolNotice.aspx.

The whole visible history (currently ~1,400 rows) renders in a single
response inside table#ContentPlaceHolder1_grdSendSMSList — newest first,
no GridView paging postback involved. We just take the first `limit` rows.

Columns: Sr.No. | Date (DD-MM-YYYY) | Send SMS (title+body, no separator) | Attachment
"""

import logging
from dataclasses import dataclass
from typing import Optional

from bs4 import BeautifulSoup

from scraper.login import ERPSession

logger = logging.getLogger(__name__)

NOTICES_PATH = "/StudentModule/SchoolNotice.aspx"
NOTICES_TABLE_ID = "ContentPlaceHolder1_grdSendSMSList"


@dataclass
class Notice:
    sr: str
    posted_date: str  # DD-MM-YYYY, as shown on site
    text: str
    attachment_url: Optional[str]


def fetch_notices(session: ERPSession, limit: int = 50) -> list:
    resp = session.get(NOTICES_PATH)
    soup = BeautifulSoup(resp.text, "lxml")
    table = soup.find("table", id=NOTICES_TABLE_ID)
    if table is None:
        raise RuntimeError(
            "Notices table not found on SchoolNotice.aspx — site structure may have changed"
        )

    rows = table.find_all("tr")[1:]  # skip header row
    notices = []
    for row in rows[:limit]:
        cells = row.find_all("td")
        if len(cells) < 4:
            continue
        sr = cells[0].get_text(strip=True)
        posted_date = cells[1].get_text(strip=True)
        text = cells[2].get_text("\n", strip=True)
        link = cells[3].find("a")
        href = link.get("href") if link else None
        attachment_url = href if href and href.rstrip("/") != "http:" else None
        notices.append(Notice(sr=sr, posted_date=posted_date, text=text, attachment_url=attachment_url))

    logger.info("Fetched %d notices (of %d rows available)", len(notices), len(rows))
    return notices


if __name__ == "__main__":
    import json

    from dotenv import load_dotenv

    from scraper.login import build_session_from_env

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    load_dotenv()

    s = build_session_from_env()
    s.login()
    result = fetch_notices(s, limit=50)
    print(json.dumps([n.__dict__ for n in result], indent=2, ensure_ascii=False))
