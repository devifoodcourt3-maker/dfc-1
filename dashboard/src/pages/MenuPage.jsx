import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search, X, Upload, Leaf, Flame } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Starters', 'Biryani', 'Curries', 'Roti&Naan', 'Rice', 'Sides', 'Desserts', 'Drinks'];
const SPICE_LEVELS = ['none', 'mild', 'medium', 'hot', 'extra-hot'];

const EMPTY_FORM = {
  name: '', description: '', price: '', mrp: '', category: '',
  isVeg: true, isBestSeller: false, isFeatured: false,
  spiceLevel: 'none', tags: '', sortOrder: 0, prepTimeMinutes: 20,
};

const MenuPage = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/dashboard/menu');
      setItems(res.data.data.items);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name, description: item.description, price: item.price,
      mrp: item.mrp || '', category: item.category, isVeg: item.isVeg,
      isBestSeller: item.isBestSeller, isFeatured: item.isFeatured,
      spiceLevel: item.spiceLevel, tags: item.tags?.join(', ') || '',
      sortOrder: item.sortOrder, prepTimeMinutes: item.prepTimeMinutes,
    });
    setImagePreview(item.imageUrl || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast.error('Name, price and category are required');
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (editingItem) {
        const res = await api.put(`/dashboard/menu/${editingItem._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setItems((prev) => prev.map((i) => i._id === editingItem._id ? res.data.data.item : i));
        toast.success('Item updated');
      } else {
        const res = await api.post('/dashboard/menu', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setItems((prev) => [res.data.data.item, ...prev]);
        toast.success('Item added');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await api.patch(`/dashboard/menu/${item._id}/toggle`);
      setItems((prev) => prev.map((i) => i._id === item._id ? res.data.data.item : i));
      toast.success(res.data.message);
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/dashboard/menu/${item._id}`);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      toast.success('Item deleted');
    } catch { toast.error('Delete failed'); }
  };

  const categories = ['all', ...new Set(items.map((i) => i.category))];
  const filtered = items.filter((i) => {
    const matchCat = categoryFilter === 'all' || i.category === categoryFilter;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Menu Management</h1>
          <p className="text-ink-500 text-sm mt-1">{items.length} items</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={17} /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="input pl-9 w-56 text-sm"
          />
        </div>
        <div className="flex gap-1 bg-white border border-ink-900/[0.07] rounded-xl p-1 flex-wrap shadow-soft">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${categoryFilter === cat ? 'bg-cream-100 text-ink-900' : 'text-ink-500 hover:text-ink-900'}`}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card p-8 text-center text-ink-500">Loading menu...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-900/[0.07]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Price</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/[0.06]">
              {filtered.map((item) => (
                <tr key={item._id} className={`hover:bg-cream-50 transition-colors ${!item.isAvailable ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-ink-400 flex-shrink-0">🍽️</div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-ink-900 text-sm truncate">{item.name}</span>
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                          {item.isBestSeller && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">⭐ Best Seller</span>}
                        </div>
                        <p className="text-xs text-ink-400 truncate max-w-xs">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-600">{item.category}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-ink-900 font-semibold text-sm">₹{item.price}</span>
                    {item.mrp && item.mrp > item.price && (
                      <p className="text-xs text-ink-400 line-through">₹{item.mrp}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(item)} className="transition-colors"
                      title={item.isAvailable ? 'Available — tap to stop orders (Sold Out)' : 'Sold Out — tap to make available again'}>
                      {item.isAvailable
                        ? <ToggleRight size={24} className="text-green-500" />
                        : <ToggleLeft size={24} className="text-ink-300" />
                      }
                    </button>
                    {!item.isAvailable && (
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mt-1">Sold Out</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)}
                        className="p-2 hover:bg-cream-100 rounded-lg text-ink-500 hover:text-ink-900 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(item)}
                        className="p-2 hover:bg-red-50 rounded-lg text-ink-500 hover:text-red-600 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-ink-500">No items found</div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-ink-900/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-soft-lg">
            <div className="flex items-center justify-between p-6 border-b border-ink-900/[0.06]">
              <h2 className="text-lg font-bold text-ink-900">{editingItem ? 'Edit Item' : 'Add Menu Item'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-cream-100 rounded-lg transition-colors">
                <X size={18} className="text-ink-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="label">Photo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl cursor-pointer transition-colors flex items-center justify-center
                    ${imagePreview ? 'border-ink-900/[0.12] h-40' : 'border-ink-900/[0.12] hover:border-brand-400 h-32'}`}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    <div className="text-center text-ink-500">
                      <Upload size={24} className="mx-auto mb-2" />
                      <p className="text-sm">Click to upload image</p>
                      <p className="text-xs text-ink-400 mt-1">JPG, PNG, WebP — max 5MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Chicken Biryani" className="input" required />
                </div>
                <div>
                  <label className="label">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="250" className="input" min="0" step="0.5" required />
                </div>
                <div>
                  <label className="label">MRP (₹) <span className="text-ink-400 text-xs">for strikethrough</span></label>
                  <input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                    placeholder="300" className="input" min="0" step="0.5" />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input" required>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Spice Level</label>
                  <select value={form.spiceLevel} onChange={(e) => setForm({ ...form, spiceLevel: e.target.value })} className="input">
                    {SPICE_LEVELS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the dish..." className="input resize-none" rows={2} />
                </div>
                <div>
                  <label className="label">Prep Time (mins)</label>
                  <input type="number" value={form.prepTimeMinutes} onChange={(e) => setForm({ ...form, prepTimeMinutes: e.target.value })}
                    className="input" min="1" />
                </div>
                <div>
                  <label className="label">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className="input" min="0" />
                </div>
                <div>
                  <label className="label">Tags <span className="text-ink-400 text-xs">comma-separated</span></label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="spicy, popular, new" className="input" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { key: 'isVeg', label: 'Vegetarian', activeColor: 'text-green-600' },
                  { key: 'isBestSeller', label: 'Best Seller', activeColor: 'text-amber-600' },
                  { key: 'isFeatured', label: 'Featured', activeColor: 'text-brand-600' },
                ].map(({ key, label, activeColor }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <div onClick={() => setForm({ ...form, [key]: !form[key] })}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center ${form[key] ? 'bg-brand-500' : 'bg-ink-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form[key] ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className={`text-sm font-medium ${form[key] ? activeColor : 'text-ink-500'}`}>{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-ink-900/[0.06]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
