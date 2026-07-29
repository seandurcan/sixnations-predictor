from pathlib import Path

def generate_tree(root_path, output_file="folder_structure.txt"):
    root = Path(root_path)

    with open(output_file, "w", encoding="utf-8") as f:

        def walk(directory, prefix=""):
            items = sorted(directory.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))

            for index, item in enumerate(items):
                is_last = index == len(items) - 1

                connector = "└── " if is_last else "├── "
                f.write(f"{prefix}{connector}{item.name}\n")

                if item.is_dir():
                    extension = "    " if is_last else "│   "
                    walk(item, prefix + extension)

        f.write(f"{root.name}\n")
        walk(root)

    print(f"Folder structure written to {output_file}")

if __name__ == "__main__":
    generate_tree(".")
``