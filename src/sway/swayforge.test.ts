import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG_TEMPLATES } from './presets';
import { parseSwayConfig, serializeSwayConfig, validateSwayConfig } from './parser';
import { getAutocompleteSuggestions } from './autocomplete';
import { createDefaultWaybarModel } from '../waybar/presets';
import {
  parseWaybarFiles,
  serializeWaybarCss,
  serializeWaybarJson,
  validateWaybarFiles,
} from '../waybar/parser';
import { getWaybarAutocompleteSuggestions } from '../waybar/autocomplete';
import {
  commitChanges,
  computeBundleDiff,
  createBranch,
  createInitialRepo,
  generateGitRestoreScript,
  getBranchHistory,
  rollbackToCommit,
  switchBranch,
} from '../git/gitEngine';

test('Sway parser and serializer preserve key directives and Waybar tandem command', () => {
  const raw = CONFIG_TEMPLATES[0].config;
  const parsed = parseSwayConfig(raw);
  assert.equal(parsed.variables.mod, 'Mod4');
  assert.equal(parsed.variables.term, 'foot');
  assert.equal(parsed.gaps.inner, 8);
  assert.equal(parsed.gaps.outer, 4);
  assert.equal(parsed.bar.enabled, true);
  assert.equal(parsed.bar.swaybarCommand, 'waybar');
  assert.ok(parsed.keybindings.length >= 10);

  const serialized = serializeSwayConfig(parsed);
  assert.match(serialized, /swaybar_command waybar/);
  assert.match(serialized, /gaps inner 8/);

  const reparsed = parseSwayConfig(serialized);
  assert.equal(reparsed.variables.term, 'foot');
  assert.equal(reparsed.bar.swaybarCommand, 'waybar');
});

test('Sway validator catches unclosed braces, duplicate bindsym, and bad hex colors', () => {
  const broken = `set $mod Mod4
bindsym $mod+Return exec foot
bindsym $mod+Return exec alacritty
client.focused #12345 #1E293B #F8FAFC #7DD3FC #38BDF8
bar {
    position top
`;
  const diags = validateSwayConfig(broken);
  assert.ok(diags.some((d) => d.message.includes('Дублирующаяся комбинация')));
  assert.ok(diags.some((d) => d.message.includes('HEX-цвет')));
  assert.ok(diags.some((d) => d.message.includes('Незакрытый блок')));
});

test('Sway autocomplete provides context-aware directives and variables', () => {
  const doc = `set $mod Mod4\nset $term foot\nfor_`;
  const topRes = getAutocompleteSuggestions(doc, doc.length);
  assert.ok(topRes.items.some((i) => i.label === 'for_window'));

  const varDoc = `set $mod Mod4\nset $term foot\nbindsym $t`;
  const varRes = getAutocompleteSuggestions(varDoc, varDoc.length);
  assert.ok(varRes.items.some((i) => i.label === '$term'));

  const barDoc = `bar {\n    pos`;
  const barRes = getAutocompleteSuggestions(barDoc, barDoc.length);
  assert.ok(barRes.items.some((i) => i.label === 'position'));
});

test('Waybar serializer and parser round-trip JSONC and CSS', () => {
  const model = createDefaultWaybarModel();
  model.position = 'bottom';
  model.height = 36;
  model.style.accentColor = '#B4BEFE';

  const jsonc = serializeWaybarJson(model);
  const css = serializeWaybarCss(model);

  const diags = validateWaybarFiles(jsonc, css);
  assert.equal(diags.length, 0);

  const reparsed = parseWaybarFiles(jsonc, css);
  assert.equal(reparsed.position, 'bottom');
  assert.equal(reparsed.height, 36);
  assert.equal(reparsed.style.accentColor, '#B4BEFE');
  assert.equal(reparsed.style.textColor, '#E2E8F0');
  assert.equal(reparsed.style.accentTextColor, '#0F172A');
  assert.notEqual(reparsed.style.textColor, reparsed.style.background);
  assert.notEqual(reparsed.style.accentTextColor, reparsed.style.accentColor);
});

test('Waybar autocomplete suggests modules and CSS selectors', () => {
  const jsonRes = getWaybarAutocompleteSuggestions('waybar/config.jsonc', '"modules-left": ["sway/', 25);
  assert.ok(jsonRes.items.some((i) => i.label.includes('sway/workspaces')));

  const cssRes = getWaybarAutocompleteSuggestions('waybar/style.css', '#workspaces button.foc', 23);
  assert.ok(cssRes.items.some((i) => i.label === '#workspaces button.focused'));
});

test('Git engine supports multi-file Sway+Waybar commits, diffs, branches, rollback, and script export', () => {
  const baseBundle = {
    'sway/config': 'set $mod Mod4\ngaps inner 8\n',
    'waybar/config.jsonc': '{\n  "position": "top"\n}\n',
    'waybar/style.css': 'window#waybar { background-color: #0F172A; }\n',
  };

  let repo = createInitialRepo(baseBundle, 'Initial', 1700000000000);
  const v1Hash = repo.branches.main;

  const updatedBundle = {
    ...baseBundle,
    'sway/config': 'set $mod Mod4\ngaps inner 16\n',
    'waybar/config.jsonc': '{\n  "position": "bottom"\n}\n',
  };

  const workingDiff = computeBundleDiff(baseBundle, updatedBundle);
  assert.equal(workingDiff.isDirty, true);
  assert.equal(workingDiff.totalAdded, 2);
  assert.equal(workingDiff.totalRemoved, 2);

  const committed = commitChanges(repo, updatedBundle, 'Increase gaps and move Waybar', 1700000010000);
  repo = committed.repo;
  assert.equal(getBranchHistory(repo).length, 2);

  // Branch experiment
  repo = createBranch(repo, 'nord-experiment');
  const expBundle = {
    ...updatedBundle,
    'waybar/style.css': 'window#waybar { background-color: #2E3440; }\n',
  };
  repo = commitChanges(repo, expBundle, 'Nord CSS', 1700000020000).repo;
  assert.equal(repo.currentBranch, 'nord-experiment');

  // Switch back to main and rollback to v1
  const switched = switchBranch(repo, 'main');
  repo = switched.repo;
  assert.equal(switched.files['sway/config'], updatedBundle['sway/config']);

  const rolled = rollbackToCommit(repo, v1Hash, 'revert-commit', 1700000030000);
  repo = rolled.repo;
  assert.equal(rolled.restoredFiles['sway/config'], baseBundle['sway/config']);
  assert.equal(rolled.restoredFiles['waybar/config.jsonc'], baseBundle['waybar/config.jsonc']);
  assert.equal(getBranchHistory(repo).length, 3);

  const script = generateGitRestoreScript(repo);
  assert.match(script, /git fast-import/);
  assert.match(script, /sway\/config/);
  assert.match(script, /waybar\/config\.jsonc/);
  assert.match(script, /waybar\/style\.css/);
});

test('Sway lossless round-trip preserves mode blocks, bindsym flags, and extra input/output options', () => {
  const raw = `set $mod Mod4
bindsym --locked XF86AudioRaiseVolume exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+
output DP-1 resolution 1920x1080@144Hz position 0,0 scale 1 transform 90
input type:touchpad {
    tap enabled
    dwt enabled
}
mode "resize" {
    bindsym h resize shrink width 10px
    bindsym Return mode "default"
}
`;
  const parsed = parseSwayConfig(raw);
  const serialized = serializeSwayConfig(parsed);
  assert.match(serialized, /bindsym --locked XF86AudioRaiseVolume/);
  assert.match(serialized, /transform 90/);
  assert.match(serialized, /dwt enabled/);
  assert.match(serialized, /mode "resize" \{/);
  assert.match(serialized, /\n\}/);
  const diags = validateSwayConfig(serialized);
  assert.equal(diags.filter((d) => d.severity === 'error').length, 0);
});

test('Sway validator catches unknown directives inside bar and input blocks and invalid enums', () => {
  const invalid = `set $mod Mod4
focus_follows_mouse maybe
bar {
    fake_bar_option 123
}
input type:keyboard {
    fake_input_key yes
}
`;
  const diags = validateSwayConfig(invalid);
  assert.ok(diags.some((d) => d.message.includes('focus_follows_mouse')));
  assert.ok(diags.some((d) => d.message.includes('fake_bar_option')));
  assert.ok(diags.some((d) => d.message.includes('fake_input_key')));
});

test('Waybar parser preserves custom JSONC module keys and validator flags unknown modules', () => {
  const customJsonc = JSON.stringify({
    position: 'top',
    'modules-left': ['sway/workspaces', 'nonexistent_module'],
    'modules-right': ['custom/weather'],
    'custom/weather': { exec: 'curl wttr.in/?format=1', interval: 1800 },
  });
  const model = parseWaybarFiles(customJsonc, 'window#waybar { background-color: #0F172A; color: #E2E8F0; }');
  model.height = 36;
  const reserialized = serializeWaybarJson(model);
  assert.match(reserialized, /"custom\/weather"/);
  assert.match(reserialized, /"interval": 1800/);

  const diags = validateWaybarFiles(customJsonc, 'window#waybar {}');
  assert.ok(diags.some((d) => d.message.includes('nonexistent_module')));
});

