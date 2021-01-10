import { executeReducerBuilderCallback } from '@internal/mapBuilders'
import { createAction, AnyAction } from '@reduxjs/toolkit'
import { expectType } from './helpers'

/** Test:  alternative builder callback for actionMap */
{
  const increment = createAction<number, 'increment'>('increment')
  const decrement = createAction<number, 'decrement'>('decrement')

  executeReducerBuilderCallback<number>(builder => {
    builder.addCase(increment, (state, action) => {
      expectType<number>(state)
      expectType<{ type: 'increment'; payload: number }>(action)
      // @ts-expect-error
      expectType<string>(state)
      // @ts-expect-error
      expectType<{ type: 'increment'; payload: string }>(action)
      // @ts-expect-error
      expectType<{ type: 'decrement'; payload: number }>(action)
      return state
    })

    builder.addCase('increment', (state, action) => {
      expectType<number>(state)
      expectType<{ type: 'increment' }>(action)
      // @ts-expect-error
      expectType<{ type: 'decrement' }>(action)
      // @ts-expect-error - this cannot be inferred and has to be manually specified
      expectType<{ type: 'increment'; payload: number }>(action)
      return state
    })

    builder.addCase(
      increment,
      (state, action: ReturnType<typeof increment>) => state
    )
    // @ts-expect-error
    builder.addCase(
      increment,
      (state, action: ReturnType<typeof decrement>) => state
    )

    builder.addCase(
      'increment',
      (state, action: ReturnType<typeof increment>) => state
    )
    // @ts-expect-error
    builder.addCase(
      'decrement',
      (state, action: ReturnType<typeof increment>) => state
    )

    // action type is inferred
    builder.addMatcher(increment.match, (state, action) => {
      expectType<ReturnType<typeof increment>>(action)
      return state
    })

    // action type defaults to AnyAction if no type predicate matcher is passed
    builder.addMatcher(
      () => true,
      (state, action) => {
        expectType<AnyAction>(action)
        return state
      }
    )

    // addCase().addMatcher() is possible, action type inferred correctly
    builder
      .addCase(
        'increment',
        (state, action: ReturnType<typeof increment>) => state
      )
      .addMatcher(decrement.match, (state, action) => {
        expectType<ReturnType<typeof decrement>>(action)
        return state
      })

    // addCase().addDefaultCase() is possible, action type is AnyAction
    builder
      .addCase(
        'increment',
        (state, action: ReturnType<typeof increment>) => state
      )
      .addDefaultCase((state, action) => {
        expectType<AnyAction>(action)
        return state
      })

    {
      // addMatcher() should prevent further calls to addCase()
      const b = builder.addMatcher(increment.match, s => s)
      // @ts-expect-error
      b.addCase(increment, s => s)
      b.addMatcher(increment.match, s => s)
      b.addDefaultCase(s => s)
    }

    {
      // addDefaultCase() should prevent further calls to addCase(), addMatcher() and addDefaultCase
      const b = builder.addDefaultCase(s => s)
      // @ts-expect-error
      b.addCase(increment, s => s)
      // @ts-expect-error
      b.addMatcher(increment.match, s => s)
      // @ts-expect-error
      b.addDefaultCase(s => s)
    }
  })
}
