import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const queryClient = useQueryClient()
  const { data: restaurants = [], isLoading } = useSuspenseQuery({
    queryKey: ['restaurants'],
    queryFn: () => api.restaurants.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.restaurants.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
    },
  })
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [country, setCountry] = useState('United States')
  const [isDetecting, setIsDetecting] = useState(false)

  const countries = [
    { name: 'United States', currency: 'USD', symbol: '$' },
    { name: 'United Kingdom', currency: 'GBP', symbol: '£' },
    { name: 'European Union', currency: 'EUR', symbol: '€' },
    { name: 'India', currency: 'INR', symbol: '₹' },
    { name: 'Japan', currency: 'JPY', symbol: '¥' },
    { name: 'Canada', currency: 'CAD', symbol: 'C$' },
    { name: 'Australia', currency: 'AUD', symbol: 'A$' },
    { name: 'Brazil', currency: 'BRL', symbol: 'R$' },
    { name: 'Nigeria', currency: 'NGN', symbol: '₦' },
    { name: 'South Africa', currency: 'ZAR', symbol: 'R' },
  ]

  const detectLocation = async () => {
    setIsDetecting(true)
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      if (data.country_name) {
        const matched = countries.find(c => 
          c.name.toLowerCase() === data.country_name.toLowerCase()
        )
        if (matched) {
          setCountry(matched.name)
        }
      }
    } catch (err) {
      console.error('Failed to detect location:', err)
    } finally {
      setIsDetecting(false)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      detectLocation()
    }
  }, [isModalOpen])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const countryData = countries.find(c => c.name === country) || countries[0]
      await createMutation.mutateAsync({ 
        name, 
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        country: countryData.name,
        currency: countryData.currency,
        currencySymbol: countryData.symbol
      })
      setIsModalOpen(false)
      setName('')
      setSlug('')
    } catch (err) {
      console.error('Failed to create restaurant:', err)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-20 px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            RestoPOS <span className="text-orange-600">Pro</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            The modern, real-time multi-tenant POS system for restaurants. 
            Select a restaurant to start managing orders.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {restaurants.map((restaurant: any) => (
            <Link
              key={restaurant.id}
              to="/pos/$slug"
              params={{ slug: restaurant.slug }}
              className="group block p-8 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-orange-500 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {restaurant.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{restaurant.country}</span>
                    <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 font-bold rounded-full">{restaurant.currencySymbol} {restaurant.currency}</span>
                  </div>
                </div>
                <div className="bg-orange-100 text-orange-600 p-3 rounded-full group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </div>
            </Link>
          ))}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-8 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center hover:bg-slate-200 hover:border-slate-400 transition-all group"
          >
            <div className="bg-white p-3 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
            <h3 className="font-semibold text-slate-900">Add New Restaurant</h3>
            <p className="text-sm text-slate-500 mt-1">Register a new tenant in the system</p>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">New Restaurant</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!slug || slug === name.toLowerCase().replace(/\s+/g, '-').slice(0, -1)) {
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                    }
                  }}
                  placeholder="e.g. Italian Kitchen"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-slate-900"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700">Country & Currency</label>
                  <button 
                    type="button"
                    onClick={detectLocation}
                    disabled={isDetecting}
                    className="text-xs text-orange-600 font-bold hover:text-orange-700 flex items-center gap-1 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                    {isDetecting ? 'Detecting...' : 'Detect My Location'}
                  </button>
                </div>
                <select 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-slate-900 bg-white"
                >
                  {countries.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.symbol} {c.currency})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">pos/</span>
                  <input 
                    required
                    type="text" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="italian-kitchen"
                    className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-slate-900"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  disabled={createMutation.isPending}
                  className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-100"
                >
                  {createMutation.isPending ? 'Creating...' : 'Register Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
