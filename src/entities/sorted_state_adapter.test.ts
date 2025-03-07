import { EntityStateAdapter, EntityState } from './models'
import { createEntityAdapter } from './create_adapter'
import { createAction } from '../createAction'
import {
  BookModel,
  TheGreatGatsby,
  AClockworkOrange,
  AnimalFarm
} from './fixtures/book'

function createNextState<S>(state: S, updateState: (s: S) => S) {
  return updateState(state)
}

describe('Sorted State Adapter', () => {
  let adapter: EntityStateAdapter<BookModel>
  let state: EntityState<BookModel>

  beforeAll(() => {
    //eslint-disable-next-line
    Object.defineProperty(Array.prototype, 'unwantedField', {
      enumerable: true,
      configurable: true,
      value: 'This should not appear anywhere'
    })
  })

  afterAll(() => {
    delete (Array.prototype as any).unwantedField
  })

  beforeEach(() => {
    adapter = createEntityAdapter({
      selectId: (book: BookModel) => book.id,
      sortComparer: (a, b) => {
        return a.title.localeCompare(b.title)
      }
    })

    state = { ids: [], entities: {} }
  })

  it('should let you add one entity to the state', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby
      }
    })
  })

  it('should let you add one entity to the state as an FSA', () => {
    const bookAction = createAction<BookModel>('books/add')
    const withOneEntity = adapter.addOne(state, bookAction(TheGreatGatsby))

    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby
      }
    })
  })

  it('should not change state if you attempt to re-add an entity', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const readded = adapter.addOne(withOneEntity, TheGreatGatsby)

    expect(readded).toBe(withOneEntity)
  })

  it('should let you add many entities to the state', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withManyMore = adapter.addMany(withOneEntity, [
      AClockworkOrange,
      AnimalFarm
    ])

    expect(withManyMore).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should let you add many entities to the state from a dictionary', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withManyMore = adapter.addMany(withOneEntity, {
      [AClockworkOrange.id]: AClockworkOrange,
      [AnimalFarm.id]: AnimalFarm
    })

    expect(withManyMore).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should remove existing and add new ones on setAll', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withAll = adapter.setAll(withOneEntity, [
      AClockworkOrange,
      AnimalFarm
    ])

    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should remove existing and add new ones on setAll when passing in a dictionary', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withAll = adapter.setAll(withOneEntity, {
      [AClockworkOrange.id]: AClockworkOrange,
      [AnimalFarm.id]: AnimalFarm
    })

    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should remove existing and add new ones on addAll (deprecated)', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withAll = adapter.setAll(withOneEntity, [
      AClockworkOrange,
      AnimalFarm
    ])

    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should let you add remove an entity from the state', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withoutOne = adapter.removeOne(withOneEntity, TheGreatGatsby.id)

    expect(withoutOne).toEqual({
      ids: [],
      entities: {}
    })
  })

  it('should let you remove many entities by id from the state', () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm
    ])

    const withoutMany = adapter.removeMany(withAll, [
      TheGreatGatsby.id,
      AClockworkOrange.id
    ])

    expect(withoutMany).toEqual({
      ids: [AnimalFarm.id],
      entities: {
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should let you remove all entities from the state', () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm
    ])

    const withoutAll = adapter.removeAll(withAll)

    expect(withoutAll).toEqual({
      ids: [],
      entities: {}
    })
  })

  it('should let you update an entity in the state', () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { title: 'A New Hope' }

    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes
        }
      }
    })
  })

  it('should not change state if you attempt to update an entity that has not been added', () => {
    const withUpdates = adapter.updateOne(state, {
      id: TheGreatGatsby.id,
      changes: { title: 'A New Title' }
    })

    expect(withUpdates).toBe(state)
  })

  it('Replaces an existing entity if you change the ID while updating', () => {
    const withAdded = adapter.setAll(state, [
      { id: 'a', title: 'First' },
      { id: 'b', title: 'Second' },
      { id: 'c', title: 'Third' }
    ])

    const withUpdated = adapter.updateOne(withAdded, {
      id: 'b',
      changes: {
        id: 'c'
      }
    })

    const { ids, entities } = withUpdated

    expect(ids.length).toBe(2)
    expect(entities.a).toBeTruthy()
    expect(entities.b).not.toBeTruthy()
    expect(entities.c).toBeTruthy()
    expect(entities.c!.id).toBe('c')
    expect(entities.c!.title).toBe('Second')
  })

  it('should not change ids state if you attempt to update an entity that does not impact sorting', () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm
    ])
    const changes = { title: 'The Great Gatsby II' }

    const withUpdates = adapter.updateOne(withAll, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withAll.ids).toBe(withUpdates.ids)
  })

  it('should let you update the id of entity', () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { id: 'A New Id' }

    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withUpdates).toEqual({
      ids: [changes.id],
      entities: {
        [changes.id]: {
          ...TheGreatGatsby,
          ...changes
        }
      }
    })
  })

  it('should resort correctly if same id but sort key update', () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AnimalFarm,
      AClockworkOrange
    ])
    const changes = { title: 'A New Hope' }

    const withUpdates = adapter.updateOne(withAll, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes
        },
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should resort correctly if the id and sort key update', () => {
    const withOne = adapter.setAll(state, [
      TheGreatGatsby,
      AnimalFarm,
      AClockworkOrange
    ])
    const changes = { id: 'A New Id', title: 'A New Hope' }

    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, changes.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [changes.id]: {
          ...TheGreatGatsby,
          ...changes
        },
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should let you update many entities by id in the state', () => {
    const firstChange = { title: 'Zack' }
    const secondChange = { title: 'Aaron' }
    const withMany = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange])

    const withUpdates = adapter.updateMany(withMany, [
      { id: TheGreatGatsby.id, changes: firstChange },
      { id: AClockworkOrange.id, changes: secondChange }
    ])

    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange
        },
        [AClockworkOrange.id]: {
          ...AClockworkOrange,
          ...secondChange
        }
      }
    })
  })

  it('should let you add one entity to the state with upsert()', () => {
    const withOneEntity = adapter.upsertOne(state, TheGreatGatsby)
    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby
      }
    })
  })

  it('should let you update an entity in the state with upsert()', () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { title: 'A New Hope' }

    const withUpdates = adapter.upsertOne(withOne, {
      ...TheGreatGatsby,
      ...changes
    })
    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes
        }
      }
    })
  })

  it('should let you upsert many entities in the state', () => {
    const firstChange = { title: 'Zack' }
    const withMany = adapter.setAll(state, [TheGreatGatsby])

    const withUpserts = adapter.upsertMany(withMany, [
      { ...TheGreatGatsby, ...firstChange },
      AClockworkOrange
    ])

    expect(withUpserts).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange
        },
        [AClockworkOrange.id]: AClockworkOrange
      }
    })
  })

  it('should do nothing when upsertMany is given an empty array', () => {
    const withMany = adapter.setAll(state, [TheGreatGatsby])

    const withUpserts = adapter.upsertMany(withMany, [])

    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby
      }
    })
  })

  it('should throw when upsertMany is passed undefined or null', async () => {
    const withMany = adapter.setAll(state, [TheGreatGatsby])

    const fakeRequest = (response: null | undefined) =>
      new Promise(resolve => setTimeout(() => resolve(response), 50))

    const undefinedBooks = (await fakeRequest(undefined)) as BookModel[]
    expect(() => adapter.upsertMany(withMany, undefinedBooks)).toThrow()

    const nullBooks = (await fakeRequest(null)) as BookModel[]
    expect(() => adapter.upsertMany(withMany, nullBooks)).toThrow()
  })

  it('should let you upsert many entities in the state when passing in a dictionary', () => {
    const firstChange = { title: 'Zack' }
    const withMany = adapter.setAll(state, [TheGreatGatsby])

    const withUpserts = adapter.upsertMany(withMany, {
      [TheGreatGatsby.id]: { ...TheGreatGatsby, ...firstChange },
      [AClockworkOrange.id]: AClockworkOrange
    })

    expect(withUpserts).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange
        },
        [AClockworkOrange.id]: AClockworkOrange
      }
    })
  })

  describe('can be used mutably when wrapped in createNextState', () => {
    test('removeAll', () => {
      const withTwo = adapter.addMany(state, [TheGreatGatsby, AnimalFarm])
      const result = createNextState(withTwo, draft => {
        return adapter.removeAll(draft)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {},
          "ids": Array [],
        }
      `)
    })

    test('addOne', () => {
      const result = createNextState(state, draft => {
        return adapter.addOne(draft, TheGreatGatsby)
      })

      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })

    test('addMany', () => {
      const result = createNextState(state, draft => {
        return adapter.addMany(draft, [TheGreatGatsby, AnimalFarm])
      })

      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "af",
            "tgg",
          ],
        }
      `)
    })

    test('setAll', () => {
      const result = createNextState(state, draft => {
        return adapter.setAll(draft, [TheGreatGatsby, AnimalFarm])
      })

      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "af",
            "tgg",
          ],
        }
      `)
    })

    test('updateOne', () => {
      const withOne = adapter.addOne(state, TheGreatGatsby)
      const changes = { title: 'A New Hope' }
      const result = createNextState(withOne, draft => {
        return adapter.updateOne(draft, {
          id: TheGreatGatsby.id,
          changes
        })
      })

      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "A New Hope",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })

    test('updateMany', () => {
      const firstChange = { title: 'First Change' }
      const secondChange = { title: 'Second Change' }
      const withMany = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange])

      const result = createNextState(withMany, draft => {
        return adapter.updateMany(draft, [
          { id: TheGreatGatsby.id, changes: firstChange },
          { id: AClockworkOrange.id, changes: secondChange }
        ])
      })

      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "aco": Object {
              "id": "aco",
              "title": "Second Change",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "First Change",
            },
          },
          "ids": Array [
            "tgg",
            "aco",
          ],
        }
      `)
    })

    test('upsertOne (insert)', () => {
      const result = createNextState(state, draft => {
        return adapter.upsertOne(draft, TheGreatGatsby)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "The Great Gatsby",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })

    test('upsertOne (update)', () => {
      const withOne = adapter.upsertOne(state, TheGreatGatsby)
      const result = createNextState(withOne, draft => {
        return adapter.upsertOne(draft, {
          id: TheGreatGatsby.id,
          title: 'A New Hope'
        })
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "tgg": Object {
              "id": "tgg",
              "title": "A New Hope",
            },
          },
          "ids": Array [
            "tgg",
          ],
        }
      `)
    })

    test('upsertMany', () => {
      const withOne = adapter.upsertOne(state, TheGreatGatsby)
      const result = createNextState(withOne, draft => {
        return adapter.upsertMany(draft, [
          {
            id: TheGreatGatsby.id,
            title: 'A New Hope'
          },
          AnimalFarm
        ])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
            "tgg": Object {
              "id": "tgg",
              "title": "A New Hope",
            },
          },
          "ids": Array [
            "tgg",
            "af",
          ],
        }
      `)
    })

    test('removeOne', () => {
      const withTwo = adapter.addMany(state, [TheGreatGatsby, AnimalFarm])
      const result = createNextState(withTwo, draft => {
        return adapter.removeOne(draft, TheGreatGatsby.id)
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "af": Object {
              "id": "af",
              "title": "Animal Farm",
            },
          },
          "ids": Array [
            "af",
          ],
        }
      `)
    })

    test('removeMany', () => {
      const withThree = adapter.addMany(state, [
        TheGreatGatsby,
        AnimalFarm,
        AClockworkOrange
      ])
      const result = createNextState(withThree, draft => {
        return adapter.removeMany(draft, [TheGreatGatsby.id, AnimalFarm.id])
      })
      expect(result).toMatchInlineSnapshot(`
        Object {
          "entities": Object {
            "aco": Object {
              "id": "aco",
              "title": "A Clockwork Orange",
            },
          },
          "ids": Array [
            "aco",
          ],
        }
      `)
    })
  })
})
