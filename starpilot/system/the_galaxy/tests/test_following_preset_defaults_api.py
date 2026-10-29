from copy import deepcopy

import pytest

from openpilot.starpilot.common import longitudinal_personality_profiles as lpp
from test_personality_profiles_api import _client, the_galaxy


@pytest.mark.parametrize("personality,preset", [("aggressive", "close"), ("standard", "medium"), ("relaxed", "far"), ("traffic", "traffic")])
def test_named_following_matches_default_reference_and_custom_conversion(monkeypatch, personality, preset):
  client, _ = _client(monkeypatch, {"CustomPersonalities": True})
  endpoint = "/api/personality_profiles"
  response = client.put(endpoint, json={"profile": personality, "category": "following", "preset": preset, "curve": []})
  assert response.status_code == 200
  body = response.get_json()
  assert preset in body["options"]["following"]
  reference = body["reference_curves"][personality]["following"]
  assert [round(lpp.interpolate_category_curve("following", speed * 0.44704, body["profiles"][personality]["following"], False), 4) for speed in lpp.FOLLOWING_SPEEDS_MPH] == reference
  response = client.put(endpoint, json={"profile": personality, "category": "following", "preset": "custom", "curve": []})
  assert response.status_code == 200
  assert response.get_json()["profiles"][personality]["following"]["curve"] == reference


def test_existing_fixed_selection_stays_visible_and_can_explicitly_change(monkeypatch):
  profiles = lpp.default_personality_profiles(False)
  profiles["standard"]["following"] = {"preset": "medium", "curve": []}
  document = lpp.profile_document(profiles, enabled=True)
  document["schemaVersion"] = 2
  original = deepcopy(document)
  client, params = _client(monkeypatch, {"CustomPersonalities": True, lpp.PERSONALITY_PROFILES_PARAM: document})
  body = client.get("/api/personality_profiles").get_json()
  assert body["migration_required"] is False
  assert body["profiles"]["standard"]["following"]["preset"] == "legacy_medium"
  assert "legacy_medium" in body["options"]["following"]
  assert params.values[lpp.PERSONALITY_PROFILES_PARAM] == original
  assert params.writes == []
  # The comparison includes the upgraded legacy identity, protecting old data.
  response = client.put("/api/personality_profiles", json={"profile": "standard", "category": "following", "preset": "medium", "curve": [], "expected": body["profiles"]["standard"]["following"]})
  assert response.status_code == 200
  assert response.get_json()["profiles"]["standard"]["following"]["preset"] == "medium"


def test_existing_dom_default_keeps_inheriting_user_following_settings(monkeypatch):
  client, _ = _client(monkeypatch, {"CustomPersonalities": True, "StandardFollow": 1.8, "StandardFollowHigh": 1.6})
  body = client.get("/api/personality_profiles").get_json()
  assert body["profiles"]["standard"]["following"]["preset"] == "dom_default"
  assert body["reference_curves"]["standard"]["following"][0] == 1.8
  assert body["reference_curves"]["standard"]["following"][-1] == 1.6


def test_ascent_reference_defaults_preserve_all_legacy_follow_modes(monkeypatch):
  values = {
    "CarModel": "SUBARU_ASCENT",
    "CustomPersonalities": True,
    "AscentGalaxyFollowDefaultsMigrated": True,
    "AggressiveFollow": 1.25,
    "AggressiveFollowHigh": 0.5,
    "StandardFollow": 1.45,
    "StandardFollowHigh": 1.45,
    "RelaxedFollow": 1.75,
    "RelaxedFollowHigh": 1.75,
    "TrafficFollow": 0.75,
  }
  monkeypatch.setattr(the_galaxy, "_safe_params_get_live_raw", lambda key, default=None, block=False: values.get(key, default))
  monkeypatch.setattr(the_galaxy, "_safe_params_get_bool", lambda key, default=False: bool(values.get(key, default)))

  aggressive = the_galaxy._get_effective_legacy_following_curve("aggressive")
  standard = the_galaxy._get_effective_legacy_following_curve("standard")
  relaxed = the_galaxy._get_effective_legacy_following_curve("relaxed")
  traffic = the_galaxy._get_effective_legacy_following_curve("traffic")

  assert aggressive[0] == pytest.approx(1.25)
  assert aggressive[5] == pytest.approx(0.5)
  assert standard == pytest.approx([1.45] * len(lpp.FOLLOWING_SPEEDS_MPH))
  assert relaxed == pytest.approx([1.75] * len(lpp.FOLLOWING_SPEEDS_MPH))
  assert traffic[0] == pytest.approx(0.75)
  assert traffic[-1] == pytest.approx(1.6)
