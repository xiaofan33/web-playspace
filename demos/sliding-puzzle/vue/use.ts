import { computed, reactive, readonly, toRefs } from 'vue';
import { createModel } from '../model';

export function useSlidingPuzzleModel() {
  const model = reactive(createModel());
  const { steps, pieces } = toRefs(model);
  const w = computed(() => model.props.w);
  const h = computed(() => model.props.h);

  return {
    w,
    h,
    isSolved: computed(() => model.isSolved),
    pieces: readonly(pieces),
    steps: readonly(steps),
    init: model.init.bind(model),
    move: model.move.bind(model),
    shuffle: model.shuffle.bind(model),
  };
}
