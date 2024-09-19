import { randomUUID } from 'crypto'
import { InMemoryRepository } from './in-memory.repository'
import { NotFoundError } from '../errors/not-found-error'

type StubModelProps = {
  id: string
  name: string
  price: number
  created_at: Date
  updated_at: Date
}

class StubInMemoryRepository extends InMemoryRepository<StubModelProps> {
  constructor() {
    super()
    this.sortableFields = ['name']
  }

  protected async applyFilter(
    items: StubModelProps[],
    filter: string | null,
  ): Promise<StubModelProps[]> {
    if (!filter) return items
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase()),
    )
  }
}

describe('InMemoryRepository unit tests', () => {
  let sut: StubInMemoryRepository
  let model: StubModelProps
  let props: any
  let created_at: Date
  let updated_at: Date

  beforeEach(() => {
    sut = new StubInMemoryRepository()
    created_at = new Date()
    updated_at = new Date()
    props = {
      name: 'test name',
      price: 10,
    }
    model = {
      id: randomUUID(),
      created_at,
      updated_at,
      ...props,
    }
  })

  describe('Create.InMemoryRepository', () => {
    it('should create a new model', () => {
      const result = sut.create(props)
      expect(result.name).toStrictEqual('test name')
    })
  })

  describe('Insert.InMemoryRepository', () => {
    it('should inserts a new model', async () => {
      const result = await sut.insert(model)
      expect(result).toStrictEqual(sut.items[0])
    })
  })

  describe('FindById.InMemoryRepository', () => {
    it('should throw error when id not found', async () => {
      await expect(sut.findById('fake_id')).rejects.toThrow(
        new NotFoundError('Model not found using ID fake_id'),
      )
      const id = randomUUID()
      await expect(sut.findById(id)).rejects.toThrow(
        new NotFoundError(`Model not found using ID ${id}`),
      )
    })

    it('should find a model by id', async () => {
      const data = await sut.insert(model)
      const result = await sut.findById(data.id)
      expect(result).toStrictEqual(data)
    })
  })

  describe('Update.InMemoryRepository', () => {
    it('should throw error when id not found', async () => {
      await expect(sut.update(model)).rejects.toThrow(
        new NotFoundError(`Model not found using ID ${model.id}`),
      )
    })

    it('should update an model', async () => {
      const data = await sut.insert(model)
      const modelUpdated = {
        id: data.id,
        name: 'updated name',
        price: 2000,
        created_at,
        updated_at,
      }
      const result = await sut.update(modelUpdated)
      expect(result).toStrictEqual(sut.items[0])
    })
  })

  describe('Delete.InMemoryRepository', () => {
    it('should throw error when id not found', async () => {
      await expect(sut.delete('fake_id')).rejects.toThrow(
        new NotFoundError('Model not found using ID fake_id'),
      )
      const id = randomUUID()
      await expect(sut.delete(id)).rejects.toThrow(
        new NotFoundError(`Model not found using ID ${id}`),
      )
    })

    it('should delete an model', async () => {
      const data = await sut.insert(model)
      expect(sut.items.length).toBe(1)
      await sut.delete(data.id)
      expect(sut.items.length).toBe(0)
    })
  })

  describe('applyFilter', () => {
    it('should no filter items when filter param is null', async () => {
      const items = [model]
      const spyFilterMethod = jest.spyOn(items, 'filter' as any)
      const result = await sut['applyFilter'](items, null)
      expect(spyFilterMethod).not.toHaveBeenCalled()
      expect(result).toStrictEqual(items)
    })

    it('should filter the data using filter param', async () => {
      const items = [
        { id: randomUUID(), name: 'test', price: 10, created_at, updated_at },
        { id: randomUUID(), name: 'TEST', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'fake', price: 30, created_at, updated_at },
      ]
      const spyFilterMethod = jest.spyOn(items, 'filter' as any)
      let result = await sut['applyFilter'](items, 'TEST')
      expect(spyFilterMethod).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual([items[0], items[1]])

      result = await sut['applyFilter'](items, 'test')
      expect(spyFilterMethod).toHaveBeenCalledTimes(2)
      expect(result).toStrictEqual([items[0], items[1]])

      result = await sut['applyFilter'](items, 'no-filter')
      expect(spyFilterMethod).toHaveBeenCalledTimes(3)
      expect(result).toHaveLength(0)
    })
  })

  describe('applySort', () => {
    it('should not sort items', async () => {
      const items = [
        { id: randomUUID(), name: 'test', price: 10, created_at, updated_at },
        { id: randomUUID(), name: 'TEST', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'fake', price: 30, created_at, updated_at },
      ]
      let result = await sut['applySort'](items, null, null)
      expect(result).toStrictEqual(items)

      result = await sut['applySort'](items, 'id', 'asc')
      expect(result).toStrictEqual(items)
    })

    it('should sort items', async () => {
      const items = [
        { id: randomUUID(), name: 'b', price: 10, created_at, updated_at },
        { id: randomUUID(), name: 'a', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'c', price: 30, created_at, updated_at },
      ]
      let result = await sut['applySort'](items, 'name', 'desc')
      expect(result).toStrictEqual([items[2], items[0], items[1]])

      result = await sut['applySort'](items, 'name', 'asc')
      expect(result).toStrictEqual([items[1], items[0], items[2]])
    })
  })

  describe('applyPaginate', () => {
    it('should paginate items', async () => {
      const items = [
        { id: randomUUID(), name: 'a', price: 10, created_at, updated_at },
        { id: randomUUID(), name: 'b', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'c', price: 30, created_at, updated_at },
        { id: randomUUID(), name: 'd', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'e', price: 30, created_at, updated_at },
      ]
      let result = await sut['applyPaginate'](items, 1, 2)
      expect(result).toStrictEqual([items[0], items[1]])

      result = await sut['applyPaginate'](items, 2, 2)
      expect(result).toStrictEqual([items[2], items[3]])

      result = await sut['applyPaginate'](items, 2, 3)
      expect(result).toStrictEqual([items[3], items[4]])
    })
  })

  describe('applyPaginate', () => {
    it('should paginate items', async () => {
      const items = [
        { id: randomUUID(), name: 'a', price: 10, created_at, updated_at },
        { id: randomUUID(), name: 'b', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'c', price: 30, created_at, updated_at },
        { id: randomUUID(), name: 'd', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'e', price: 30, created_at, updated_at },
      ]
      let result = await sut['applyPaginate'](items, 1, 2)
      expect(result).toStrictEqual([items[0], items[1]])

      result = await sut['applyPaginate'](items, 2, 2)
      expect(result).toStrictEqual([items[2], items[3]])

      result = await sut['applyPaginate'](items, 2, 3)
      expect(result).toStrictEqual([items[3], items[4]])
    })
  })

  describe('search', () => {
    it('should paginate items', async () => {
      const items = Array(16).fill(model)
      sut.items = items
      const result = await sut.search({})
      expect(result).toStrictEqual({
        items: Array(15).fill(model),
        total: 16,
        current_page: 1,
        per_page: 15,
        sort: null,
        sort_dir: null,
        filter: null,
      })
    })

    it('should apply paginate and filter', async () => {
      const items = [
        { id: randomUUID(), name: 'test', price: 10, created_at, updated_at },
        { id: randomUUID(), name: 'a', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'TEST', price: 30, created_at, updated_at },
        { id: randomUUID(), name: 'TeSt', price: 20, created_at, updated_at },
      ]
      sut.items = items
      const result = await sut.search({
        page: 1,
        per_page: 2,
        filter: 'test',
      })
      expect(result).toStrictEqual({
        items: [items[0], items[2]],
        total: 3,
        current_page: 1,
        per_page: 2,
        sort: null,
        sort_dir: null,
        filter: 'test',
      })
    })

    it('should apply paginate and sort', async () => {
      const items = [
        { id: randomUUID(), name: 'b', price: 10, created_at, updated_at },
        { id: randomUUID(), name: 'a', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'd', price: 30, created_at, updated_at },
        { id: randomUUID(), name: 'e', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'c', price: 20, created_at, updated_at },
      ]
      sut.items = items
      let result = await sut.search({
        page: 1,
        per_page: 2,
        sort: 'name',
        sort_dir: 'asc',
      })
      expect(result).toStrictEqual({
        items: [items[1], items[0]],
        total: 5,
        current_page: 1,
        per_page: 2,
        sort: 'name',
        sort_dir: 'asc',
        filter: null,
      })

      result = await sut.search({
        page: 2,
        per_page: 2,
        sort: 'name',
        sort_dir: 'asc',
      })
      expect(result).toStrictEqual({
        items: [items[4], items[2]],
        total: 5,
        current_page: 2,
        per_page: 2,
        sort: 'name',
        sort_dir: 'asc',
        filter: null,
      })
    })

    it('should search using filter, sort and paginate', async () => {
      const items = [
        { id: randomUUID(), name: 'TEST', price: 10, created_at, updated_at },
        { id: randomUUID(), name: 'a', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'test', price: 30, created_at, updated_at },
        { id: randomUUID(), name: 'e', price: 20, created_at, updated_at },
        { id: randomUUID(), name: 'TeSt', price: 20, created_at, updated_at },
      ]
      sut.items = items
      let result = await sut.search({
        page: 1,
        per_page: 2,
        sort: 'name',
        sort_dir: 'asc',
        filter: 'TEST',
      })
      expect(result).toStrictEqual({
        items: [items[0], items[4]],
        total: 3,
        current_page: 1,
        per_page: 2,
        sort: 'name',
        sort_dir: 'asc',
        filter: 'TEST',
      })

      result = await sut.search({
        page: 1,
        per_page: 2,
        sort: 'name',
        sort_dir: 'desc',
        filter: 'test',
      })
      expect(result).toStrictEqual({
        items: [items[2], items[4]],
        total: 3,
        current_page: 1,
        per_page: 2,
        sort: 'name',
        sort_dir: 'desc',
        filter: 'test',
      })
    })
  })
})
