from types import SimpleNamespace

from openpilot.starpilot.common import starpilot_backups as backups


class FakeParams:
  def __init__(self):
    self.values = {}

  def get_int(self, key, return_default=False, default=0):
    return self.values.get(key, default)

  def put(self, key, value):
    self.values[key] = value


def test_backup_starpilot_sanitizes_branch_name(monkeypatch, tmp_path):
  backup_root = tmp_path / "backups"
  monkeypatch.setattr(backups, "STARPILOT_BACKUPS", backup_root)
  captured = {}
  monkeypatch.setattr(backups, "create_backup", lambda source, destination, *args, **kwargs: captured.update(destination=destination))

  metadata = SimpleNamespace(
    openpilot=SimpleNamespace(git_commit="e566ea795d1691a5d299ed74efbea39d90e055e7"),
    channel="codex/ascent-galaxy-defaults",
  )
  backups.backup_starpilot(metadata, FakeParams())

  assert captured["destination"] == backup_root / "e566ea795d1691a5d299ed74efbea39d90e055e7_codex_ascent-galaxy-defaults_auto"


def test_create_compressed_backup_creates_missing_parent(tmp_path):
  source = tmp_path / "source"
  source.mkdir()
  (source / "content.txt").write_text("backup payload")
  destination = tmp_path / "missing" / "nested" / "backup_auto"

  backups.create_backup(source, destination, "ok", "failed", FakeParams(), compressed=True)

  assert (destination.parent / f"{destination.name}.tar.zst").is_file()
