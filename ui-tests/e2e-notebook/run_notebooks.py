#!/usr/bin/env python3
"""Execute notebook-based E2E scenarios with Papermill."""

from __future__ import annotations

import sys
from pathlib import Path
import argparse
import os
import subprocess

import papermill as pm
from papermill.exceptions import PapermillExecutionError

NOTEBOOK_ROOT = Path(__file__).resolve().parent / "notebooks"
ARTIFACT_ROOT = Path(__file__).resolve().parent / "artifacts"
RESULT_ROOT = ARTIFACT_ROOT / "notebooks"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Execute notebook E2E tests.")
    parser.add_argument(
        "--skip-failed-test",
        dest="skip_failed_test",
        action="store_true",
        help="Continue executing remaining notebooks even if a notebook fails.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not NOTEBOOK_ROOT.exists():
        raise FileNotFoundError(f"Notebook directory not found: {NOTEBOOK_ROOT}")

    notebooks = sorted(NOTEBOOK_ROOT.glob("*.ipynb"))

    transition_timeout_env = os.getenv("E2E_TRANSITION_TIMEOUT")
    if transition_timeout_env:
        try:
            transition_timeout = int(transition_timeout_env)
        except ValueError as exc:
            raise ValueError("E2E_TRANSITION_TIMEOUT must be an integer") from exc
    else:
        transition_timeout = None

    default_delay_env = os.getenv("E2E_DEFAULT_DELAY")
    if default_delay_env:
        try:
            default_delay = int(default_delay_env)
        except ValueError as exc:
            raise ValueError("E2E_DEFAULT_DELAY must be an integer") from exc
    else:
        default_delay = None

    ARTIFACT_ROOT.mkdir(parents=True, exist_ok=True)
    RESULT_ROOT.mkdir(parents=True, exist_ok=True)

    if not notebooks:
        print("No notebooks to execute. Add notebooks under ui-tests/e2e-notebook/notebooks.")
        return 0

    failures: list[Path] = []

    for notebook in notebooks:
        result_notebook = RESULT_ROOT / f"{notebook.stem}-result.ipynb"
        notebook_dir = notebook.parent
        notebook_artifact_dir = RESULT_ROOT / notebook.stem
        notebook_artifact_dir.mkdir(parents=True, exist_ok=True)

        # Clean up sidestickies-tmp directory in container before each test
        container_name = os.getenv("SIDESTICKIES_CONTAINER_NAME", "sidestickies-test")
        subprocess.run(
            ["docker", "exec", container_name, "rm", "-rf", "/home/jovyan/sidestickies-tmp"]
        )
        print(f"Cleaned up sidestickies-tmp in container {container_name}")

        print(f"Running notebook: {notebook} -> {result_notebook}")
        parameters = {"default_result_path": str(notebook_artifact_dir)}
        if transition_timeout is not None:
            parameters["transition_timeout"] = transition_timeout
        if default_delay is not None:
            parameters["default_delay"] = default_delay

        jupyterlab_url = os.getenv("JUPYTERLAB_URL")
        if jupyterlab_url:
            parameters["jupyterlab_url"] = jupyterlab_url

        notebook7_url = os.getenv("NOTEBOOK7_URL")
        if notebook7_url:
            parameters["notebook7_url"] = notebook7_url
        try:
            pm.execute_notebook(
                str(notebook),
                str(result_notebook),
                parameters=parameters,
                cwd=str(notebook_dir),
            )
        except PapermillExecutionError as err:
            failures.append(notebook)
            if not args.skip_failed_test:
                raise
            print(f"Notebook failed but continuing: {notebook} (reason: {err})")

    if failures:
        print("Failed notebooks:")
        for failed in failures:
            print(f"  - {failed}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
