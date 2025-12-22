import {
  computed,
  reactive,
  readonly,
  ref,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
} from 'vue';
import {
  useElementBounding,
  useEventListener,
  useLocalStorage,
  useTimestamp,
} from '@vueuse/core';
import { settingsStoreKey } from '../res/config.json';
import { defaultSettings, type SettingOptions } from '../theme';
import { createModel, type CellAction } from '../model';

export function useMinesweeperModel() {
  const model = reactive(createModel());

  const props = computed(() => model.props);
  const stage = computed(() => model.stage);
  const remainMinesCount = computed(() => {
    return model.props.m - model.flagIndexSet.size;
  });

  const timerMs = ref(0);
  const stamp = useTimestamp();
  watchEffect(() => {
    if (stage.value === 'ready') {
      timerMs.value = 0;
    } else if (stage.value === 'playing') {
      const { startAt = stamp.value, duration } = model.timer;
      timerMs.value = stamp.value - startAt + duration;
    }
  });

  return {
    props,
    stage,
    remainMinesCount,
    timerMs: readonly(timerMs),
    init: model.init.bind(model),
    dump: model.dump.bind(model),
    restart: model.restart.bind(model),
    operate: model.operate.bind(model),
    getCellGrid: model.getCellGrid.bind(model),
    getAroundCells: model.getAroundCells.bind(model),
  };
}

export function useBoardEvent(
  target: MaybeRefOrGetter<HTMLElement | undefined | null>,
  handler?: (a: CellAction) => void,
) {
  const pointerPosition = ref({ x: 0, y: 0 });
  const enableHighlight = ref(false);

  const boardEl = computed(() => toValue(target));
  const { top, left, width, height } = useElementBounding(boardEl);
  useEventListener(boardEl, 'pointerdown', event => {
    const getPos = (e: PointerEvent) => ({
      x: e.clientX - left.value + boardEl.value!.scrollLeft,
      y: e.clientY - top.value + boardEl.value!.scrollTop,
    });

    const onPointermove = (e: PointerEvent) => {
      const { x, y } = getPos(e);
      if (x >= 0 && x < width.value && y >= 0 && y < height.value) {
        pointerPosition.value = { x, y };
        enableHighlight.value = notRightClick;
      } else {
        enableHighlight.value = false;
      }
    };

    const onPointerup = (e: PointerEvent) => {
      enableHighlight.value = false;
      document.body.removeEventListener('pointermove', onPointermove);
      document.body.removeEventListener('pointerup', onPointerup);
      document.body.removeEventListener('pointercancel', onPointerup);
    };

    const notRightClick = event.button !== 2;
    enableHighlight.value = notRightClick;
    pointerPosition.value = getPos(event);
    document.body.addEventListener('pointermove', onPointermove);
    document.body.addEventListener('pointerup', onPointerup);
    document.body.addEventListener('pointercancel', onPointerup);
  });

  const operateMatch: Array<[keyof HTMLElementEventMap, CellAction]> = [
    ['click', 'open'],
    ['contextmenu', 'flag'],
    ['dblclick', 'open-around'],
  ];
  operateMatch.forEach(([eventName, action]) => {
    useEventListener(boardEl, eventName, event => {
      event.preventDefault();
      handler?.(action);
    });
  });

  return {
    pointerPosition: readonly(pointerPosition),
    enableHighlight: readonly(enableHighlight),
  };
}

export function useSettingOptions(key?: string) {
  const settings = useLocalStorage<SettingOptions>(
    key || settingsStoreKey,
    defaultSettings,
    { mergeDefaults: true },
  );

  function update(value: Partial<SettingOptions>) {
    settings.value = { ...settings.value, ...value };
  }

  function reset() {
    settings.value = { ...defaultSettings };
  }

  return {
    settings,
    update,
    reset,
  };
}
