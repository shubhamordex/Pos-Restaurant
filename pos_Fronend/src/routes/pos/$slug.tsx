import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { useState } from 'react'
import type { Id } from '../../../convex/_generated/dataModel'
import { useMutation } from 'convex/react'

export const Route = createFileRoute('/pos/$slug')({
  component: PosDashboard,
})

function PosDashboard() {
  const { slug } = Route.useParams()
  const { data: restaurant } = useSuspenseQuery(convexQuery(api.restaurants.getBySlug, { slug }))
  
  if (!restaurant) {
    return <div>Restaurant not found</div>
  }

  return <PosContent restaurant={restaurant} />
}

function PosContent({ restaurant }: { restaurant: any }) {
  const { data: categories } = useSuspenseQuery(convexQuery(api.categories.listByRestaurant, { restaurantId: restaurant._id }))
  const { data: menuItems } = useSuspenseQuery(convexQuery(api.menuItems.listByRestaurant, { restaurantId: restaurant._id }))
  const { data: tables } = useSuspenseQuery(convexQuery(api.tables.listByRestaurant, { restaurantId: restaurant._id }))
  
  const createCategory = useMutation(api.categories.create)
  const updateCategory = useMutation(api.categories.update)
  const deleteCategory = useMutation(api.categories.remove)
  
  const createMenuItem = useMutation(api.menuItems.create)
  const updateMenuItem = useMutation(api.menuItems.update)
  const deleteMenuItem = useMutation(api.menuItems.remove)

  const updateTableStatus = useMutation(api.tables.updateStatus)

  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"categories"> | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<Array<{ item: any, quantity: number }>>([])
  const [isManageMode, setIsManageMode] = useState(false)
  const [currentTab, setCurrentTab] = useState<'menu' | 'tables'>('menu')
  const [selectedTableId, setSelectedTableId] = useState<Id<"tables"> | null>(null)
  
  // Modals
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddMenuItem, setShowAddMenuItem] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Forms
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '' as Id<"categories"> | '',
    image: '',
    available: true
  })

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (item: any) => {
    if (!item.available) return
    setCart(current => {
      const existing = current.find(c => c.item._id === item._id)
      if (existing) {
        return current.map(c => c.item._id === item._id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...current, { item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(current => current.filter(c => c.item._id !== itemId))
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(current => current.map(c => {
      if (c.item._id === itemId) {
        const newQty = Math.max(1, c.quantity + delta)
        return { ...c, quantity: newQty }
      }
      return c
    }))
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    await createCategory({ restaurantId: restaurant._id, name: newCategoryName.trim() })
    setNewCategoryName('')
    setShowAddCategory(false)
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory?.name.trim()) return
    await updateCategory({ id: editingCategory._id, name: editingCategory.name.trim() })
    setEditingCategory(null)
  }

  const handleDeleteCategory = async (id: Id<"categories">) => {
    if (confirm("Are you sure? This will also delete ALL items in this category.")) {
      await deleteCategory({ id })
      if (selectedCategoryId === id) setSelectedCategoryId('all')
    }
  }

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name || !newItem.price || !newItem.categoryId) return
    await createMenuItem({
      restaurantId: restaurant._id,
      categoryId: newItem.categoryId as Id<"categories">,
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      image: newItem.image || null
    })
    setNewItem({ name: '', description: '', price: '', categoryId: '', image: '', available: true })
    setShowAddMenuItem(false)
  }

  const handleUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    await updateMenuItem({
      id: editingItem._id,
      categoryId: editingItem.categoryId,
      name: editingItem.name,
      description: editingItem.description,
      price: parseFloat(editingItem.price.toString()),
      image: editingItem.image || null,
      available: editingItem.available
    })
    setEditingItem(null)
  }

  const handleDeleteMenuItem = async (id: Id<"menuItems">) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteMenuItem({ id })
    }
  }

  const total = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0)

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar - Categories */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">{restaurant.name}</h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">POS Dashboard</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Categories</span>
            <button 
              onClick={() => setShowAddCategory(true)}
              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-orange-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          </div>
          <button
            onClick={() => { setSelectedCategoryId('all'); setIsManageMode(false); setCurrentTab('menu'); }}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
              selectedCategoryId === 'all' && !isManageMode && currentTab === 'menu'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-200' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>
          {categories.map(category => (
            <div key={category._id} className="group flex items-center gap-1">
              <button
                onClick={() => { setSelectedCategoryId(category._id); setIsManageMode(false); setCurrentTab('menu'); }}
                className={`flex-1 text-left px-4 py-3 rounded-xl transition-all ${
                  selectedCategoryId === category._id && !isManageMode && currentTab === 'menu'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-200' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {category.name}
              </button>
              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingCategory(category)}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button 
                  onClick={() => handleDeleteCategory(category._id)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))}
          
          <div className="mt-8 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Service
          </div>
          <button
            onClick={() => { setCurrentTab('tables'); setIsManageMode(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
              currentTab === 'tables' && !isManageMode
                ? 'bg-orange-600 text-white shadow-md shadow-orange-200' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            Floor Plan
          </button>
          
          <div className="mt-4 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Admin
          </div>
          <button
            onClick={() => setIsManageMode(true)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
              isManageMode
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Manage Menu
          </button>
        </div>
        <div className="p-4 border-t border-slate-200">
          <Link to="/" className="w-full flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-lg">
             <button className="px-4 py-1.5 bg-white shadow-sm rounded-md text-sm font-medium text-slate-900">Dine In</button>
             <button className="px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">Take Away</button>
             <button className="px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">Delivery</button>
          </div>
          <div className="flex items-center gap-4">
            {isManageMode && (
              <button 
                onClick={() => setShowAddMenuItem(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Add Item
              </button>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              <input 
                type="text" 
                placeholder="Search menu..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-orange-500 w-64 text-slate-900 outline-none"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {isManageMode ? (
            <div className="max-w-5xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Menu Management</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Item</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Price</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {menuItems.map(item => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400 overflow-hidden">
                              {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : 
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-500 truncate w-48">{item.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">
                            {categories.find(c => c._id === item.categoryId)?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{restaurant.currencySymbol}{item.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => updateMenuItem({ 
                              id: item._id,
                              categoryId: item.categoryId,
                              name: item.name,
                              description: item.description,
                              price: item.price,
                              image: item.image,
                              available: !item.available 
                            })}
                            className={`px-2 py-1 text-xs font-bold rounded-full transition-colors ${item.available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                          >
                            {item.available ? 'Available' : 'Sold Out'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingItem(item)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteMenuItem(item._id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : currentTab === 'tables' ? (
            <div className="max-w-5xl">
               <h2 className="text-2xl font-bold text-slate-900 mb-6">Real-time Table Booking</h2>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                 {tables.map(table => (
                   <div 
                    key={table._id}
                    className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center text-center group ${
                      table.status === 'available' ? 'bg-white border-slate-100 hover:border-green-500 hover:shadow-lg' :
                      table.status === 'occupied' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                   >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                       table.status === 'available' ? 'bg-green-100 text-green-600' :
                       table.status === 'occupied' ? 'bg-orange-100 text-orange-600' :
                       'bg-blue-100 text-blue-600'
                     }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/></svg>
                     </div>
                     <span className="text-2xl font-black text-slate-900 mb-1">Table {table.number}</span>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-4">{table.capacity} Seats</span>
                     
                     <div className="flex flex-col gap-2 w-full mt-auto">
                        {table.status === 'available' ? (
                          <>
                            <button 
                              onClick={() => updateTableStatus({ id: table._id, status: 'occupied' })}
                              className="w-full py-2 bg-green-600 text-white rounded-xl text-xs font-bold shadow-md shadow-green-100 hover:bg-green-700 transition-all"
                            >
                              Seat Guests
                            </button>
                            <button 
                              onClick={() => updateTableStatus({ id: table._id, status: 'reserved' })}
                              className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 hover:bg-blue-700 transition-all"
                            >
                              Reserve
                            </button>
                          </>
                        ) : table.status === 'occupied' ? (
                          <>
                            <button 
                              onClick={() => { setSelectedTableId(table._id); setCurrentTab('menu'); }}
                              className="w-full py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-100 hover:bg-orange-700 transition-all"
                            >
                              Order Food
                            </button>
                            <button 
                              onClick={() => updateTableStatus({ id: table._id, status: 'available' })}
                              className="w-full py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-white transition-all"
                            >
                              Check Out
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => updateTableStatus({ id: table._id, status: 'occupied' })}
                            className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-black transition-all"
                          >
                            Arrived
                          </button>
                        )}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <button
                  key={item._id}
                  onClick={() => addToCart(item)}
                  disabled={!item.available}
                  className={`group bg-white p-4 rounded-2xl shadow-sm border transition-all text-left flex flex-col h-full ${
                    item.available 
                      ? 'border-slate-200 hover:border-orange-500 hover:shadow-md cursor-pointer' 
                      : 'border-slate-100 opacity-60 grayscale cursor-not-allowed'
                  }`}
                >
                  <div className="w-full aspect-square bg-slate-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center text-slate-400 relative">
                    {!item.available && (
                       <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                          <span className="bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl">Sold Out</span>
                       </div>
                    )}
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
                    )}
                  </div>
                  <h3 className={`font-bold transition-colors line-clamp-1 ${item.available ? 'text-slate-900 group-hover:text-orange-600' : 'text-slate-400'}`}>{item.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{item.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">{restaurant.currencySymbol}{item.price.toFixed(2)}</span>
                    <div className={`p-2 rounded-lg transition-all ${item.available ? 'bg-slate-100 text-slate-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-slate-50 text-slate-300'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Cart - Right Panel */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-bold text-slate-900">Current Order</h2>
            <button onClick={() => { setCart([]); setSelectedTableId(null); }} className="text-sm text-slate-400 hover:text-red-500 transition-colors">Clear all</button>
          </div>
          {selectedTableId && (
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              Table {tables.find(t => t._id === selectedTableId)?.number}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              </div>
              <p className="font-medium text-slate-500">Your cart is empty</p>
              <p className="text-sm">Add items to start an order</p>
            </div>
          ) : (
            cart.map(({ item, quantity }) => (
              <div key={item._id} className="flex gap-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400 overflow-hidden">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> :
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                  <p className="text-sm text-slate-500">{restaurant.currencySymbol}{item.price.toFixed(2)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                      <button 
                        onClick={() => updateQuantity(item._id, -1)}
                        className="p-1 px-2 hover:bg-slate-200 transition-colors text-slate-600"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-sm font-bold text-slate-900 border-x border-slate-200">{quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item._id, 1)}
                        className="p-1 px-2 hover:bg-slate-200 transition-colors text-slate-600"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item._id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50/50 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{restaurant.currencySymbol}{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (8%)</span>
              <span>{restaurant.currencySymbol}{(total * 0.08).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>{restaurant.currencySymbol}{(total * 1.08).toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            disabled={cart.length === 0 || !selectedTableId}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:bg-orange-700 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            {!selectedTableId && cart.length > 0 ? 'Select a Table' : 'Place Order'}
          </button>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Add Category</h2>
              <button onClick={() => setShowAddCategory(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none text-slate-900 focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Seafood"
                />
              </div>
              <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Edit Category</h2>
              <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none text-slate-900 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                Update Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {showAddMenuItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Add Menu Item</h2>
              <button onClick={() => setShowAddMenuItem(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleAddMenuItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                  <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea rows={2} value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price ({restaurant.currencySymbol})</label>
                  <input required type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select required value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value as Id<"categories">})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                  <input type="text" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="https://..." />
                </div>
              </div>
              <button className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all mt-4">
                Save Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Edit Menu Item</h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateMenuItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                  <input required type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea rows={2} value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price ({restaurant.currencySymbol})</label>
                  <input required type="number" step="0.01" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select required value={editingItem.categoryId} onChange={e => setEditingItem({...editingItem, categoryId: e.target.value as Id<"categories">})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-orange-500 outline-none">
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="avail" checked={editingItem.available} onChange={e => setEditingItem({...editingItem, available: e.target.checked})} className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded" />
                  <label htmlFor="avail" className="text-sm font-medium text-slate-700">Available for ordering</label>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                  <input type="text" value={editingItem.image || ''} onChange={e => setEditingItem({...editingItem, image: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all">Cancel</button>
                <button className="flex-2 bg-orange-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-orange-700 transition-all">
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
