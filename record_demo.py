"""Record a project-specific SignalBridge walkthrough for the Prom Virgo demo."""
from __future__ import annotations

import shutil
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "demo"
TARGET = OUT / "signalbridge_classroom_demo_2026-09-05.webm"
URL = "http://127.0.0.1:8787/?demo=1"


def pause(page, milliseconds: int) -> None:
    page.wait_for_timeout(milliseconds)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            device_scale_factor=1,
            record_video_dir=str(OUT),
            record_video_size={"width": 1280, "height": 900},
        )
        page = context.new_page()
        page.goto(URL, wait_until="networkidle", timeout=60000)
        pause(page, 8000)

        page.locator('select[aria-label="Please pause support action"]').select_option("quiet-space")
        pause(page, 12000)
        page.get_by_role("button", name="Correct: pause", exact=True).click()
        pause(page, 12000)
        page.get_by_role("button", name="It helped", exact=True).click()
        pause(page, 12000)

        page.locator('[data-sample="ask"]').click()
        pause(page, 14000)
        page.locator('[data-feedback="ask"]').click()
        pause(page, 10000)

        page.get_by_role("button", name="Reset demo", exact=True).click()
        pause(page, 10000)
        page.locator('[data-sample="ready"]').click()
        pause(page, 42000)

        video = page.video
        page.close()
        context.close()
        browser.close()
        if not video:
            raise SystemExit("no video recorded")
        source = Path(video.path())
        shutil.copyfile(source, TARGET)
        print(f"saved {TARGET} ({TARGET.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
