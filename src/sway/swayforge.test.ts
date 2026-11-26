import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSageSwayConfig, CONFIG_TEMPLATES } from './presets';
import { parseSwayConfig, serializeSwayConfig, validateSwayConfig } from './parser';
import { getAutocompleteSuggestions } from './autocomplete';
import { createDefaultWaybarModel, WAYBAR_THEME_PRESETS } from '../waybar/presets';
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
import {
  analyzeInstalledPackages,
  applyPackagesToSwayModel,
  getConfigurableAppsFromAnalysis,
  parsePackageList,
  SAMPLE_ARCH_SWAY_PACKAGES,
} from '../packages/packageAnalyzer';
import {
  createDefaultEcosystemSettings,
  deriveSystemPalette,
  generateUnifiedEcosystemFiles,
  generateUnifiedInstallScript,
} from '../ecosystem/ecosystemEngine';
import {
  detectBindingCommandFromKeys,
  detectBranchName,
  detectCommitMessage,
  detectGtkTheme,
  detectOutputName,
} from '../utils/autoDetect';

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

test('Sage Dark, Light, and Automatic templates parse cleanly and have matching Waybar presets', () => {
  const sageIds = ['sage-dark', 'sage-light', 'sage-auto'] as const;
  for (const id of sageIds) {
    const tpl = CONFIG_TEMPLATES.find((t) => t.id === id);
    assert.ok(tpl, `Missing template ${id}`);
    const parsed = parseSwayConfig(tpl.config);
    assert.equal(parsed.bar.swaybarCommand, 'waybar');
    const diags = validateSwayConfig(tpl.config);
    assert.equal(
      diags.filter((d) => d.severity === 'error').length,
      0,
      `Template ${id} has validation errors: ${JSON.stringify(diags)}`
    );
  }

  const sageDarkTpl = CONFIG_TEMPLATES.find((t) => t.id === 'sage-dark');
  assert.ok(sageDarkTpl);
  assert.match(sageDarkTpl.config, /set \$term alacritty/);
  assert.match(sageDarkTpl.config, /set \$menu wofi --show drun/);
  assert.match(sageDarkTpl.config, /JetBrainsMono Nerd Font/);
  assert.match(sageDarkTpl.config, /brightnessctl/);
  assert.match(sageDarkTpl.config, /satty/);
  assert.match(sageDarkTpl.config, /blueman-applet/);
  assert.doesNotMatch(sageDarkTpl.config, /\bfuzzel\b/);
  assert.doesNotMatch(sageDarkTpl.config, /\bmako\b/);

  const autoLight = buildSageSwayConfig('auto', false);
  const autoDark = buildSageSwayConfig('auto', true);
  assert.match(autoLight, /output \* bg #C2CEC1 solid_color/);
  assert.match(autoLight, /darkman/);
  assert.match(autoDark, /output \* bg #242B26 solid_color/);
  assert.equal(validateSwayConfig(autoLight).filter((d) => d.severity === 'error').length, 0);
  assert.equal(validateSwayConfig(autoDark).filter((d) => d.severity === 'error').length, 0);

  assert.equal(WAYBAR_THEME_PRESETS['sage-dark'].style.accentColor, '#D0C4A8');
  assert.equal(WAYBAR_THEME_PRESETS['sage-dark'].style.barMode, 'islands');
  assert.equal(WAYBAR_THEME_PRESETS['sage-light'].style.accentColor, '#5B7F63');
  assert.equal(WAYBAR_THEME_PRESETS['sage-light'].style.islandBg, '#E6ECE5');

  const sageModel = createDefaultWaybarModel();
  const darkPreset = WAYBAR_THEME_PRESETS['sage-dark'];
  sageModel.style = { ...darkPreset.style };
  sageModel.modulesLeft = [...(darkPreset.modulesLeft ?? [])];
  sageModel.modulesCenter = [...(darkPreset.modulesCenter ?? [])];
  sageModel.modulesRight = [...(darkPreset.modulesRight ?? [])];
  sageModel.clockFormat = darkPreset.clockFormat ?? '{:%I:%M %p}';

  const jsonc = serializeWaybarJson(sageModel);
  const css = serializeWaybarCss(sageModel);
  assert.match(jsonc, /"group\/left-pill"/);
  assert.match(jsonc, /"group\/sysinfo"/);
  assert.match(jsonc, /"group\/controls"/);
  assert.match(css, /background-color:\s*transparent/);
  assert.match(css, /#2C3438/);
  assert.equal(validateWaybarFiles(jsonc, css).length, 0);

  const reparsedWaybar = parseWaybarFiles(jsonc, css);
  assert.equal(reparsedWaybar.style.barMode, 'islands');
  assert.equal(reparsedWaybar.style.islandBg, '#2C3438');
  assert.equal(reparsedWaybar.style.accentColor, '#D0C4A8');
  assert.equal(reparsedWaybar.style.windowTextColor, '#D8DDD9');
  assert.ok(reparsedWaybar.modulesLeft.includes('custom/launcher'));
  assert.ok(reparsedWaybar.modulesRight.includes('bluetooth'));

  const lightModel = createDefaultWaybarModel();
  lightModel.style = { ...WAYBAR_THEME_PRESETS['sage-light'].style };
  const reparsedLight = parseWaybarFiles(
    serializeWaybarJson(lightModel),
    serializeWaybarCss(lightModel)
  );
  assert.equal(reparsedLight.style.windowTextColor, '#1E2620');
});

test('Package parser and analyzer detect redundant stacks, missing Wayland packages, and sync Sway', () => {
  const parsedWithVersions = parsePackageList(`
    # comment line
    alacritty 0.15.1-1
    extra/wofi 1.4.1-2 [installed]
    netctl
    networkmanager 1.50.0-1
    fish
    zsh
    wl-clipboard
    qt6-base
  `);
  assert.ok(parsedWithVersions.includes('alacritty'));
  assert.ok(parsedWithVersions.includes('wofi'));
  assert.ok(!parsedWithVersions.includes('0.15.1-1'));

  const analysis = analyzeInstalledPackages(parsePackageList(SAMPLE_ARCH_SWAY_PACKAGES));
  assert.ok(analysis.redundant.some((r) => r.id === 'net-netctl'));
  assert.ok(analysis.redundant.some((r) => r.id === 'dual-shells'));
  assert.ok(analysis.redundant.some((r) => r.id === 'nvidia-firmware-on-amd'));

  assert.ok(analysis.missing.some((m) => m.packageName === 'mako'));
  assert.ok(analysis.missing.some((m) => m.packageName === 'swaylock'));
  assert.ok(analysis.missing.some((m) => m.packageName === 'swayidle'));
  assert.ok(analysis.missing.some((m) => m.packageName === 'cliphist'));
  assert.ok(analysis.missing.some((m) => m.packageName === 'qt6-wayland'));
  assert.match(analysis.installCommand, /^sudo pacman -S /);
  assert.equal(analysis.recommendedTerm, 'alacritty');
  assert.equal(analysis.recommendedMenu, 'wofi --show drun');

  const baseSway = parseSwayConfig(CONFIG_TEMPLATES[0].config);
  const syncedSway = applyPackagesToSwayModel(baseSway, analysis);
  assert.equal(syncedSway.variables.term, 'alacritty');
  assert.equal(syncedSway.variables.menu, 'wofi --show drun');
  assert.equal(syncedSway.general.font, 'JetBrainsMono Nerd Font');
});

test('Unified ecosystem engine generates cohesive configs for Alacritty/Foot, Wofi/Fuzzel, Mako, Swaylock, and GTK', () => {
  const sageDarkSway = parseSwayConfig(buildSageSwayConfig('dark', true));
  const waybarDark = createDefaultWaybarModel();
  waybarDark.style = { ...WAYBAR_THEME_PRESETS['sage-dark'].style };

  const eco = createDefaultEcosystemSettings();
  const palette = deriveSystemPalette(sageDarkSway, waybarDark, 'auto');
  assert.equal(palette.isDark, true);
  assert.equal(palette.accent, '#D0C4A8');

  const files = generateUnifiedEcosystemFiles(sageDarkSway, waybarDark, eco);
  const alacrittyFile = files.find((f) => f.id === 'alacritty/alacritty.toml');
  const wofiCssFile = files.find((f) => f.id === 'wofi/style.css');
  const makoFile = files.find((f) => f.id === 'mako/config');
  const swaylockFile = files.find((f) => f.id === 'swaylock/config');
  const gtkFile = files.find((f) => f.id === 'gtk-3.0/settings.ini');

  assert.ok(alacrittyFile && /#D0C4A8/i.test(alacrittyFile.content));
  assert.ok(wofiCssFile && /#2C3438/i.test(wofiCssFile.content));
  assert.ok(makoFile && /border-radius=12/.test(makoFile.content));
  assert.ok(swaylockFile && /ring-ver-color=D0C4A8/i.test(swaylockFile.content));
  assert.ok(gtkFile && /gtk-application-prefer-dark-theme=1/.test(gtkFile.content));

  const footEco = {
    ...eco,
    terminalApp: 'foot' as const,
    launcherApp: 'fuzzel' as const,
    colorMode: 'light' as const,
  };
  const sageLightSway = parseSwayConfig(buildSageSwayConfig('light', false));
  const waybarLight = createDefaultWaybarModel();
  waybarLight.style = { ...WAYBAR_THEME_PRESETS['sage-light'].style };
  const lightPalette = deriveSystemPalette(sageLightSway, waybarLight, footEco.colorMode);
  assert.equal(lightPalette.isDark, false);

  const lightFiles = generateUnifiedEcosystemFiles(sageLightSway, waybarLight, footEco);
  const footFile = lightFiles.find((f) => f.id === 'foot/foot.ini');
  const fuzzelFile = lightFiles.find((f) => f.id === 'fuzzel/fuzzel.ini');
  const lightGtk = lightFiles.find((f) => f.id === 'gtk-3.0/settings.ini');
  assert.ok(footFile && !footFile.content.includes('background=#'));
  assert.ok(fuzzelFile && /selection=5B7F63ff/i.test(fuzzelFile.content));
  assert.ok(lightGtk && /gtk-application-prefer-dark-theme=0/.test(lightGtk.content));

  const script = generateUnifiedInstallScript(
    buildSageSwayConfig('dark', true),
    '{}',
    'window#waybar {}',
    files,
    palette,
    eco
  );
  assert.match(script, /alacritty\/alacritty\.toml/);
  assert.match(script, /wofi\/style\.css/);
  assert.match(script, /gsettings set org\.gnome\.desktop\.interface color-scheme 'prefer-dark'/);
});

test('getConfigurableAppsFromAnalysis returns only actually detected configurable apps', () => {
  const emptySections = getConfigurableAppsFromAnalysis(analyzeInstalledPackages([]));
  assert.deepEqual(emptySections, []);

  const sampleAnalysis = analyzeInstalledPackages(parsePackageList(SAMPLE_ARCH_SWAY_PACKAGES));
  const sampleIds = getConfigurableAppsFromAnalysis(sampleAnalysis).map((s) => s.id);
  assert.deepEqual(sampleIds, ['app-alacritty', 'app-foot', 'app-wofi', 'app-gtk']);
  assert.ok(!sampleIds.includes('app-mako'));
  assert.ok(!sampleIds.includes('app-swaylock'));
  assert.ok(!sampleIds.includes('app-fuzzel'));

  const fullAnalysis = analyzeInstalledPackages(
    parsePackageList('fuzzel\nmako\nswaylock-effects\ngtk3')
  );
  const fullIds = getConfigurableAppsFromAnalysis(fullAnalysis).map((s) => s.id);
  assert.deepEqual(fullIds, ['app-fuzzel', 'app-mako', 'app-swaylock', 'app-gtk']);
});

test('Deep Sway customization directives round-trip cleanly without syntax errors', () => {
  const base = parseSwayConfig(CONFIG_TEMPLATES[0].config);
  base.general.hideEdgeBorders = 'smart';
  base.general.workspaceLayout = 'tabbed';
  base.general.defaultFloatingBorder = 'pixel';
  base.general.floatingBorderThickness = 2;
  base.general.focusWrapping = 'workspace';
  base.general.mouseWarping = 'container';
  base.inputs[0].repeatDelay = 240;
  base.inputs[0].repeatRate = 45;
  base.inputs[1].dwt = 'disabled';
  base.inputs[1].accelProfile = 'flat';
  base.inputs[1].scrollFactor = 1.4;
  base.outputs[0].transform = '90';
  base.outputs[0].adaptiveSync = 'on';
  base.rules.push({
    id: 'rule-nofocus',
    type: 'no_focus',
    criteria: '[app_id="waybar"]',
    action: '',
  });

  const serialized = serializeSwayConfig(base);
  assert.match(serialized, /hide_edge_borders smart/);
  assert.match(serialized, /workspace_layout tabbed/);
  assert.match(serialized, /default_floating_border pixel 2/);
  assert.match(serialized, /focus_wrapping workspace/);
  assert.match(serialized, /mouse_warping container/);
  assert.match(serialized, /repeat_delay 240/);
  assert.match(serialized, /repeat_rate 45/);
  assert.match(serialized, /dwt disabled/);
  assert.match(serialized, /accel_profile flat/);
  assert.match(serialized, /scroll_factor 1\.4/);
  assert.match(serialized, /transform 90/);
  assert.match(serialized, /adaptive_sync on/);
  assert.match(serialized, /no_focus \[app_id="waybar"\]/);

  const diags = validateSwayConfig(serialized);
  assert.equal(diags.filter((d) => d.severity === 'error').length, 0);

  const reparsed = parseSwayConfig(serialized);
  assert.equal(reparsed.general.hideEdgeBorders, 'smart');
  assert.equal(reparsed.general.workspaceLayout, 'tabbed');
  assert.equal(reparsed.general.focusWrapping, 'workspace');
  assert.equal(reparsed.inputs[0].repeatDelay, 240);
  assert.equal(reparsed.inputs[0].repeatRate, 45);
  assert.equal(reparsed.inputs[1].dwt, 'disabled');
  assert.equal(reparsed.inputs[1].accelProfile, 'flat');
  assert.equal(reparsed.inputs[1].scrollFactor, 1.4);
  assert.equal(reparsed.outputs[0].transform, '90');
  assert.equal(reparsed.outputs[0].adaptiveSync, 'on');
  assert.ok(reparsed.rules.some((r) => r.type === 'no_focus' && r.criteria === '[app_id="waybar"]'));
});

test('Deep Waybar layout, module thresholds, and CSS border/padding round-trip cleanly', () => {
  const wb = createDefaultWaybarModel();
  wb.layer = 'overlay';
  wb.reloadStyleOnChange = true;
  wb.temperatureCriticalThreshold = 88;
  wb.pulseaudioScrollStep = 3;
  wb.batteryWarning = 25;
  wb.style.borderWidth = 2;
  wb.style.modulePaddingX = 14;
  wb.style.modulePaddingY = 5;

  const jsonc = serializeWaybarJson(wb);
  const css = serializeWaybarCss(wb);
  assert.match(jsonc, /"layer": "overlay"/);
  assert.match(jsonc, /"reload_style_on_change": true/);
  assert.match(jsonc, /"critical-threshold": 88/);
  assert.match(jsonc, /"scroll-step": 3/);
  assert.match(jsonc, /"warning": 25/);
  assert.match(css, /border: 2px solid/);

  assert.equal(validateWaybarFiles(jsonc, css).length, 0);

  const reparsed = parseWaybarFiles(jsonc, css);
  assert.equal(reparsed.layer, 'overlay');
  assert.equal(reparsed.reloadStyleOnChange, true);
  assert.equal(reparsed.temperatureCriticalThreshold, 88);
  assert.equal(reparsed.pulseaudioScrollStep, 3);
  assert.equal(reparsed.batteryWarning, 25);
  assert.equal(reparsed.style.borderWidth, 2);
  assert.equal(reparsed.style.modulePaddingX, 14);
  assert.equal(reparsed.style.modulePaddingY, 5);
});

test('Deep Ecosystem settings generate custom Alacritty, Foot, Wofi, Mako, Swaylock, and GTK directives', () => {
  const sway = parseSwayConfig(buildSageSwayConfig('dark', true));
  const wb = createDefaultWaybarModel();
  wb.style = { ...WAYBAR_THEME_PRESETS['sage-dark'].style };

  const eco = {
    ...createDefaultEcosystemSettings(),
    terminalCursorStyle: 'Underline' as const,
    terminalCursorBlink: 'Off' as const,
    terminalScrollback: 25000,
    terminalDecorations: 'None' as const,
    launcherColumns: 2,
    launcherLocation: 'top' as const,
    launcherPrompt: 'Run:',
    makoAnchor: 'bottom-right' as const,
    makoMaxVisible: 6,
    swaylockRadius: 112,
    swaylockShowClock: true,
    swaylockEffectBlur: '8x4',
    gtkCursorSize: 32,
    gtkAnimations: false,
    gtkOverlayScrolling: false,
  };

  const files = generateUnifiedEcosystemFiles(sway, wb, eco);
  const alacritty = files.find((f) => f.id === 'alacritty/alacritty.toml')?.content ?? '';
  const wofiConf = files.find((f) => f.id === 'wofi/config')?.content ?? '';
  const mako = files.find((f) => f.id === 'mako/config')?.content ?? '';
  const swaylock = files.find((f) => f.id === 'swaylock/config')?.content ?? '';
  const gtk = files.find((f) => f.id === 'gtk-3.0/settings.ini')?.content ?? '';

  assert.match(alacritty, /shape = "Underline"/);
  assert.match(alacritty, /history = 25000/);
  assert.match(alacritty, /decorations = "None"/);
  assert.match(wofiConf, /columns=2/);
  assert.match(wofiConf, /location=top/);
  assert.match(wofiConf, /prompt=Run:/);
  assert.match(mako, /anchor=bottom-right/);
  assert.match(mako, /max-visible=6/);
  assert.match(swaylock, /indicator-radius=112/);
  assert.match(swaylock, /\nclock\n/);
  assert.match(swaylock, /effect-blur=8x4/);
  assert.match(gtk, /gtk-cursor-theme-size=32/);
  assert.match(gtk, /gtk-enable-animations=0/);
  assert.match(gtk, /gtk-overlay-scrolling=0/);

  const footFiles = generateUnifiedEcosystemFiles(sway, wb, {
    ...eco,
    terminalApp: 'foot',
    launcherApp: 'fuzzel',
  });
  const foot = footFiles.find((f) => f.id === 'foot/foot.ini')?.content ?? '';
  const fuzzel = footFiles.find((f) => f.id === 'fuzzel/fuzzel.ini')?.content ?? '';
  assert.match(foot, /lines=25000/);
  assert.match(foot, /style=underline/);
  assert.match(fuzzel, /prompt="Run: "/);
});

test('Auto-detect helpers derive sensible values from package analysis, palette, and Git diff', () => {
  const analysis = analyzeInstalledPackages(parsePackageList(SAMPLE_ARCH_SWAY_PACKAGES));
  const sway = parseSwayConfig(CONFIG_TEMPLATES[0].config);
  const wb = createDefaultWaybarModel();
  const palette = deriveSystemPalette(sway, wb, 'dark');

  assert.equal(detectOutputName(analysis, 0), 'eDP-1');
  assert.equal(detectOutputName(analysis, 1), 'HDMI-A-1');
  assert.equal(detectGtkTheme(palette), 'Adwaita-dark');
  assert.match(detectBindingCommandFromKeys('$mod+Return', sway, analysis), /exec alacritty/);
  assert.match(detectBindingCommandFromKeys('$mod+Shift+s', sway, analysis), /satty/);

  const base = {
    'sway/config': 'set $mod Mod4\n',
    'waybar/config.jsonc': '{}\n',
    'waybar/style.css': 'window#waybar {}\n',
  };
  const diff = computeBundleDiff(base, {
    ...base,
    'sway/config': 'set $mod Mod4\ngaps inner 10\n',
  });
  assert.match(detectCommitMessage(diff, 'en'), /Update sway\/config/);
  assert.match(detectCommitMessage(diff, 'ru'), /Обновлены sway\/config/);

  const branch = detectBranchName({ main: 'abc', 'exp/sage-islands': 'def' }, {
    ...wb,
    style: { ...wb.style, barMode: 'islands' },
  });
  assert.equal(branch, 'exp/sage-islands-2');
});

test('Nordic template parses cleanly, validates with 0 errors, and pairs with nord-frost Waybar preset', () => {
  const nordic = CONFIG_TEMPLATES.find((t) => t.id === 'nordic');
  assert.ok(nordic, 'Missing nordic template');
  assert.equal(nordic.themeId, 'nord-frost');

  const parsed = parseSwayConfig(nordic.config);
  assert.equal(parsed.bar.swaybarCommand, 'waybar');
  assert.equal(parsed.colors.focused.border, '#88C0D0');
  assert.equal(parsed.variables.term, 'alacritty');
  assert.equal(parsed.variables.menu, 'wofi --show drun');

  const diags = validateSwayConfig(nordic.config);
  assert.equal(diags.filter((d) => d.severity === 'error').length, 0);
  assert.ok(WAYBAR_THEME_PRESETS['nord-frost']);
});





