import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { searchGBIF, fetchBotanicalImage } from '../gbifApi'
import { searchTrefle } from '../trefleApi'

const MOCK_GBIF_RESPONSE = {
  results: [
    {
      key: 12345,
      kingdom: 'Plantae',
      scientificName: 'Solanum lycopersicum L.',
      vernacularName: 'Tomato',
      family: 'Solanaceae',
      genus: 'Solanum',
      species: 'Solanum lycopersicum'
    },
    {
      key: 67890,
      kingdom: 'Animalia', // Should be filtered out
      scientificName: 'Some Bug',
    }
  ]
}

const MOCK_TREFLE_RESPONSE = {
  data: [
    {
      id: 987,
      scientific_name: 'Solanum lycopersicum',
      common_name: 'Tomato',
      family: 'Solanaceae',
      genus: 'Solanum',
      image_url: 'https://example.com/tomato.jpg'
    }
  ]
}

describe('Taxonomy APIs', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GBIF API', () => {
    it('returns empty array for empty query', async () => {
      const results = await searchGBIF('')
      expect(results).toEqual([])
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it('fetches and maps GBIF data correctly, filtering non-plants', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_GBIF_RESPONSE
      } as any)

      const results = await searchGBIF('tomato')
      
      expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('api.gbif.org/v1/species/search?q=tomato'))
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        id: 'gbif-12345',
        source: 'GBIF',
        scientificName: 'Solanum lycopersicum L.',
        commonName: 'Tomato',
        family: 'Solanaceae',
        genus: 'Solanum',
        species: 'lycopersicum'
      })
    })

    it('handles API errors gracefully', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('Network error'))
      const results = await searchGBIF('tomato')
      expect(results).toEqual([])
    })
  })

  describe('Trefle API', () => {
    it('returns empty array if no token is provided', async () => {
      // Temporarily remove the token from env if it exists
      const originalToken = import.meta.env.VITE_TREFLE_TOKEN
      import.meta.env.VITE_TREFLE_TOKEN = ''

      const results = await searchTrefle('tomato')
      expect(results).toEqual([])
      expect(globalThis.fetch).not.toHaveBeenCalled()

      // Restore it
      import.meta.env.VITE_TREFLE_TOKEN = originalToken
    })

    it('fetches and maps Trefle data correctly when token is provided', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_TREFLE_RESPONSE
      } as any)

      const results = await searchTrefle('tomato', 'fake_token')
      
      expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('trefle.io/api/v1/plants/search?token=fake_token&q=tomato'))
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        id: 'trefle-987',
        source: 'TREFLE',
        scientificName: 'Solanum lycopersicum',
        commonName: 'Tomato',
        family: 'Solanaceae',
        genus: 'Solanum',
        species: 'lycopersicum',
        imageUrl: 'https://example.com/tomato.jpg'
      })
    })
  })

  describe('fetchBotanicalImage (Wikipedia REST API)', () => {
    it('returns undefined if genus or species is empty', async () => {
      expect(await fetchBotanicalImage('', 'lycopersicum')).toBeUndefined()
      expect(await fetchBotanicalImage('Solanum', '')).toBeUndefined()
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it('resolves image URL from Wikipedia thumbnail or originalimage', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          thumbnail: { source: 'https://upload.wikimedia.org/wikipedia/commons/tomato_thumb.jpg' },
        })
      } as any)

      const url = await fetchBotanicalImage('Solanum', 'lycopersicum')
      expect(globalThis.fetch).toHaveBeenCalledWith('https://en.wikipedia.org/api/rest_v1/page/summary/Solanum_lycopersicum')
      expect(url).toBe('https://upload.wikimedia.org/wikipedia/commons/tomato_thumb.jpg')
    })

    it('falls back silently on HTTP errors or network failures', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('Network error'))
      const url = await fetchBotanicalImage('Nonexistent', 'plant')
      expect(url).toBeUndefined()
    })
  })
})
