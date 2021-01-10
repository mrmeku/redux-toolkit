import {
  EntityState,
  EntityStateAdapter,
  IdSelector,
  Update,
  EntityId
} from './models'
import {
  createStateOperator,
  createSingleArgumentStateOperator
} from './state_adapter'
import { selectIdValue } from './utils'

export function createUnsortedStateAdapter<T>(
  selectId: IdSelector<T>
): EntityStateAdapter<T> {
  type R = EntityState<T>

  function addOne(entity: T, state: R): R {
    const key = selectIdValue(entity, selectId)

    if (key in state.entities) {
      return state
    }

    state.ids.push(key)
    state.entities[key] = entity

    return state
  }

  function addMany(entities: T[] | Record<EntityId, T>, state: R): R {
    if (!Array.isArray(entities)) {
      entities = Object.values(entities)
    }

    for (const entity of entities) {
      state = addOne(entity, state)
    }

    return state
  }

  function setAll(entities: T[] | Record<EntityId, T>, state: R): R {
    if (!Array.isArray(entities)) {
      entities = Object.values(entities)
    }

    state.ids = []
    state.entities = {}

    return addMany(entities, state)
  }

  function removeOne(key: EntityId, state: R): R {
    return removeMany([key], state)
  }

  function removeMany(keys: EntityId[], state: R): R {
    let didMutate = false

    keys.forEach(key => {
      if (key in state.entities) {
        delete state.entities[key]
        didMutate = true
      }
    })

    if (didMutate) {
      state.ids = state.ids.filter(id => id in state.entities)
    }

    return state
  }

  function removeAll(state: R): R {
    Object.assign(state, {
      ids: [],
      entities: {}
    })
    return state
  }

  function takeNewKey(
    keys: { [id: string]: EntityId },
    update: Update<T>,
    state: R
  ): boolean {
    const original = state.entities[update.id]
    const updated: T = Object.assign({}, original, update.changes)
    const newKey = selectIdValue(updated, selectId)
    const hasNewKey = newKey !== update.id

    if (hasNewKey) {
      keys[update.id] = newKey
      delete state.entities[update.id]
    }

    state.entities[newKey] = updated

    return hasNewKey
  }

  function updateOne(update: Update<T>, state: R): R {
    return updateMany([update], state)
  }

  function updateMany(updates: Update<T>[], state: R): R {
    const newKeys: { [id: string]: EntityId } = {}

    const updatesPerEntity: { [id: string]: Update<T> } = updates.reduce(
      (updatesPerEntity, update) => {
        // Only apply updates to entities that currently exist
        if (update.id in state.entities) {
          // If there are multiple updates to one entity, merge them together
          updatesPerEntity[update.id] = {
            id: update.id,
            // Spreads ignore falsy values, so this works even if there isn't
            // an existing update already at this key
            changes: {
              ...(updatesPerEntity[update.id]
                ? updatesPerEntity[update.id].changes
                : null),
              ...update.changes
            }
          }
        }

        return updatesPerEntity
      },
      {} as { [id: string]: Update<T> }
    )

    updates = Object.values(updatesPerEntity)

    const didMutateEntities = updates.length > 0

    if (didMutateEntities) {
      const didMutateIds =
        updates.filter(update => takeNewKey(newKeys, update, state)).length > 0

      if (didMutateIds) {
        state.ids = state.ids.map(id => newKeys[id] || id)
      }
    }

    return state
  }

  function upsertOne(entity: T, state: R): R {
    return upsertMany([entity], state)
  }

  function upsertMany(entities: T[] | Record<EntityId, T>, state: R): R {
    if (!Array.isArray(entities)) {
      entities = Object.values(entities)
    }

    const added: T[] = []
    const updated: Update<T>[] = []

    for (const entity of entities) {
      const id = selectIdValue(entity, selectId)
      if (id in state.entities) {
        updated.push({ id, changes: entity })
      } else {
        added.push(entity)
      }
    }

    state = updateMany(updated, state)
    state = addMany(added, state)

    return state
  }

  return {
    removeAll: createSingleArgumentStateOperator(removeAll),
    addOne: createStateOperator(addOne),
    addMany: createStateOperator(addMany),
    setAll: createStateOperator(setAll),
    updateOne: createStateOperator(updateOne),
    updateMany: createStateOperator(updateMany),
    upsertOne: createStateOperator(upsertOne),
    upsertMany: createStateOperator(upsertMany),
    removeOne: createStateOperator(removeOne),
    removeMany: createStateOperator(removeMany)
  }
}
