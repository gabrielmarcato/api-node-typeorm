import { NotFoundError } from '@/common/domain/errors/not-found-error'
import { ProductsInMemoryRepository } from './products-in-memory.repository'
import { ProductsDataBuilder } from '../../testing/helpers/products-data-builder'
import { ConflictError } from '@/common/domain/errors/conflict-error'

describe('ProductsInMemoryRepository unit tests', () => {
  let sut: ProductsInMemoryRepository

  beforeEach(() => {
    sut = new ProductsInMemoryRepository()
  })

  describe('findByName.ProductsInMemoryRepository', () => {
    it('should throw error when product not found', async () => {
      await expect(() => sut.findByName('fake_name')).rejects.toThrow(
        new NotFoundError('Product not found using name fake_name'),
      )
      await expect(() => sut.findByName('fake_name')).rejects.toBeInstanceOf(
        NotFoundError,
      )
    })

    it('should find a product by name', async () => {
      const data = ProductsDataBuilder({ name: 'Curso nodejs' })
      sut.items.push(data)
      const result = await sut.findByName('Curso nodejs')
      expect(result).toStrictEqual(data)
    })
  })

  describe('conflictingName.ProductsInMemoryRepository', () => {
    it('should throw error when product found', async () => {
      const data = ProductsDataBuilder({ name: 'Curso nodejs' })
      sut.items.push(data)

      await expect(() => sut.conflictingName('Curso nodejs')).rejects.toThrow(
        new ConflictError('Name already used on another product'),
      )
      await expect(() =>
        sut.conflictingName('Curso nodejs'),
      ).rejects.toBeInstanceOf(ConflictError)
    })

    it('should not find a product by name', async () => {
      expect.assertions(0)
      await sut.conflictingName('Curso nodejs')
    })
  })

  describe('applyFilter.ProductsInMemoryRepository', () => {
    it('should no filter items when filter param is null', async () => {
      const data = ProductsDataBuilder({})
      sut.items.push(data)
      const spyFilterMethod = jest.spyOn(sut.items, 'filter' as any)
      const result = await sut['applyFilter'](sut.items, null)
      expect(spyFilterMethod).not.toHaveBeenCalled()
      expect(result).toStrictEqual(sut.items)
    })

    it('should filter the data using filter param', async () => {
      const items = [
        ProductsDataBuilder({ name: 'Test' }),
        ProductsDataBuilder({ name: 'TEST' }),
        ProductsDataBuilder({ name: 'fake' }),
      ]
      sut.items.push(...items)
      const spyFilterMethod = jest.spyOn(sut.items, 'filter' as any)
      const result = await sut['applyFilter'](sut.items, 'TEST')
      expect(spyFilterMethod).toHaveBeenCalledTimes(1)
      expect(result).toStrictEqual([items[0], items[1]])
    })
  })

  describe('applySort.ProductsInMemoryRepository', () => {
    it('should sort items by created_at when sort param is null', async () => {
      const created_at = new Date()
      const items = [
        ProductsDataBuilder({ name: 'c', created_at: created_at }),
        ProductsDataBuilder({
          name: 'a',
          created_at: new Date(created_at.getTime() + 100),
        }),
        ProductsDataBuilder({
          name: 'b',
          created_at: new Date(created_at.getTime() + 200),
        }),
      ]
      sut.items.push(...items)
      const result = await sut['applySort'](sut.items, null, null)
      expect(result).toStrictEqual([items[2], items[1], items[0]])
    })

    it('should sort items by name field', async () => {
      const items = [
        ProductsDataBuilder({ name: 'c' }),
        ProductsDataBuilder({ name: 'a' }),
        ProductsDataBuilder({ name: 'b' }),
      ]
      sut.items.push(...items)
      const result = await sut['applySort'](sut.items, 'name', 'desc')
      expect(result).toStrictEqual([items[0], items[2], items[1]])
    })
  })
})
