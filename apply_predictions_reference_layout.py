from __future__ import annotations

import hashlib
import shutil
import sys
from pathlib import Path


DEFAULT_PROJECT_ROOT = Path(r"C:\Projects\sixnations-predictor")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return path.read_text(encoding="utf-8-sig")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8", newline="")


def replace_required(
    content: str,
    desired: str,
    accepted_existing: list[str],
    description: str,
) -> tuple[str, bool]:
    if desired in content:
        print(f"Already correct: {description}")
        return content, False

    for candidate in accepted_existing:
        if candidate in content:
            print(f"Updating: {description}")
            return content.replace(candidate, desired, 1), True

    raise RuntimeError(
        f"Could not locate the expected code for: {description}"
    )


def update_file(
    path: Path,
    transformations: list[
        tuple[str, list[str], str]
    ],
) -> None:
    original = read_text(path)
    updated = original
    changed = False

    for desired, accepted, description in transformations:
        updated, did_change = replace_required(
            updated,
            desired,
            accepted,
            description,
        )
        changed = changed or did_change

    if not changed:
        print(f"No file change required: {path}")
        return

    backup = Path(f"{path}.predictions-reference.bak")
    shutil.copy2(path, backup)
    write_text(path, updated)

    print(f"Updated: {path}")
    print(f"Backup:  {backup}")


def main() -> int:
    project_root = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else DEFAULT_PROJECT_ROOT
    )

    protected_paths = [
        project_root
        / "src/components/layout/PageContainer.tsx",
        project_root
        / "src/app/predictions/page.tsx",
        project_root
        / "src/app/leaderboard/page.tsx",
    ]

    for path in protected_paths:
        if not path.exists():
            raise FileNotFoundError(
                f"Protected file not found: {path}"
            )

    protected_hashes = {
        path: sha256(path)
        for path in protected_paths
    }

    dashboard_transformations = [
        (
            '<div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-4">',
            [
                '<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">'
            ],
            "primary dashboard statistics grid",
        ),
        (
            '<div className="mx-auto mt-4 grid max-w-5xl gap-3 md:grid-cols-3">',
            [
                '<div className="mt-4 grid gap-3 md:grid-cols-3">'
            ],
            "secondary dashboard statistics grid",
        ),
        (
            '<div className="mx-auto mt-5 grid max-w-5xl gap-4 md:grid-cols-2">',
            [
                '<div className="mt-5 grid gap-4 md:grid-cols-2">'
            ],
            "dashboard lower card grid",
        ),
    ]

    update_file(
        project_root / "src/app/dashboard/page.tsx",
        dashboard_transformations,
    )

    update_file(
        project_root
        / "src/app/admin/dashboard/page.tsx",
        dashboard_transformations,
    )

    update_file(
        project_root / "src/app/admin/page.tsx",
        [
            (
                '<div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">',
                [
                    '<div className="grid grid-cols-1 gap-6 md:grid-cols-3">',
                    '<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(340px,1.15fr)_minmax(0,1.85fr)]">',
                ],
                "Admin Results main grid",
            )
        ],
    )

    update_file(
        project_root
        / "src/app/admin/audit/page.tsx",
        [
            (
                '<Card title="Audit History" className="mx-auto max-w-5xl">',
                [
                    '<Card title="Audit History">',
                    '<Card title="Audit History" className="w-full">',
                ],
                "Audit History card",
            )
        ],
    )

    for path in protected_paths:
        after_hash = sha256(path)
        if after_hash != protected_hashes[path]:
            raise RuntimeError(
                f"Protected file changed unexpectedly: {path}"
            )
        print(f"Verified unchanged: {path}")

    print()
    print("Layout changes completed successfully.")
    print(
        "PageContainer, Predictions and Leaderboard "
        "were not changed."
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print()
        print("ERROR:")
        print(exc)
        print()
        input("Press Enter to close...")
        raise SystemExit(1)
