import { EntityState, PreventAny } from './models'
import { PayloadAction, isFSA } from '../createAction'

export function createSingleArgumentStateOperator<V>(
  mutator: (state: EntityState<V>) => EntityState<V>
) {
  const operator = createStateOperator((_: undefined, state: EntityState<V>) =>
    mutator(state)
  )

  return function operation<S extends EntityState<V>>(
    state: PreventAny<S, V>
  ): S {
    return operator(state as S, undefined) as S
  }
}

export function createStateOperator<V, R, S extends EntityState<V>>(
  mutator: (arg: R, state: EntityState<V>) => S
) {
  return function operation(state: S, arg: R | PayloadAction<R>): S {
    function isPayloadActionArgument(
      arg: R | PayloadAction<R>
    ): arg is PayloadAction<R> {
      return isFSA(arg)
    }

    const runMutator = (draft: EntityState<V>) => {
      if (isPayloadActionArgument(arg)) {
        return mutator(arg.payload, draft)
      } else {
        return mutator(arg, draft)
      }
    }

    return runMutator(state)
  }
}
