import { createSelector } from 'reselect'
import { createDraftSafeSelector } from './createDraftSafeSelector'

type State = { value: number }
const selectSelf = (state: State) => state

test('handles normal values correctly', () => {
  const unsafeSelector = createSelector(selectSelf, x => x.value)
  const draftSafeSelector = createDraftSafeSelector(selectSelf, x => x.value)

  let state = { value: 1 }
  expect(unsafeSelector(state)).toBe(1)
  expect(draftSafeSelector(state)).toBe(1)

  state = { value: 2 }
  expect(unsafeSelector(state)).toBe(2)
  expect(draftSafeSelector(state)).toBe(2)
})
