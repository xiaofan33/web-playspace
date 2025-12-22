import themePreset from './res/preset.json';
import { settings } from './res/config.json';
import type { AroundMineCount } from './model';

export type EmojiKey = keyof typeof themePreset.emojis;
export type ColorKey = keyof typeof themePreset.bgColors;

type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type SettingOptions = Prettify<
  Omit<typeof settings, 'colorKey'> & {
    palette: ColorKey;
  }
>;

export const defaultSettings = settings as SettingOptions;

export interface ThemePreset {
  emojis: Record<EmojiKey, string>;
  fgColors: Record<AroundMineCount, string>;
  bgColors: Record<ColorKey, [string /* highlight */, string /* normal */]>;
}

class ThemeLoader {
  private preset: ThemePreset;

  constructor(preset: ThemePreset) {
    this.preset = preset;
  }

  get palette() {
    return Object.keys(this.preset.bgColors) as ColorKey[];
  }

  getEmoji(key: EmojiKey) {
    return this.preset.emojis[key];
  }

  getFgColor(key: AroundMineCount) {
    return this.preset.fgColors[key];
  }

  getBgColor(key: ColorKey, isHighlight = false) {
    return this.preset.bgColors[key][isHighlight ? 0 : 1];
  }

  getBgColorRandom(excluded?: ColorKey) {
    const candidates = this.palette.filter(key => key !== excluded);
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }
}

export const themeLoader = new ThemeLoader(themePreset as ThemePreset);
