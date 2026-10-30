# StarPilot repository guidance

## Scope and data

- Keep fork changes limited to Subaru Ascent support and verified StarPilot defects needed by this checkout.
- Store route logs, video, extraction output, and vehicle-specific analysis outside Git, under the local `D:\OpenPilot\Logs` or `D:\OpenPilot\Output` folders.
- Never reset or clean the Comma checkout. Inspect its status first and preserve local themes and generated Panda firmware artifacts.

## Validation

- The Windows checkout has `core.symlinks=false`; symlink stubs and ARM-built artifacts can break Windows or WSL x86 tests. Run targeted Python tests in WSL with a Linux view that restores required package symlinks and uses x86_64 extensions.
- Run the narrow relevant pytest target and Ruff on changed Python files. Report missing runtime or build coverage explicitly.

## Comma deployment

- Before device changes, confirm offroad state and inspect the current branch, commit, and working-tree changes.
- Deploy with fast-forward Git operations; never overwrite user changes. For Panda safety-source changes, back up the current firmware, build the Comma 4 H7 image, install it offroad, and verify the runtime Panda signature against the installed image.
- After service restart, verify the expected commit, active service, `IsOffroad=1`, `IsOnroad=0`, and that the Panda firmware loader completed.
