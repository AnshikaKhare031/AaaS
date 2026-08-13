import React, { useEffect, useState } from 'react';
import { FolderTree, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Category } from '../../types';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/api';
import { slugify } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '/images/tulip_bouquet.jpg',
  });

  const { success, error } = useToast();

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openForm = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setForm({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        image_url: cat.image_url || '/images/tulip_bouquet.jpg',
      });
    } else {
      setEditingCategory(null);
      setForm({
        name: '',
        slug: '',
        description: '',
        image_url: '/images/tulip_bouquet.jpg',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Category> = {
        ...form,
        slug: form.slug || slugify(form.name),
        is_active: true,
      };

      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        success(`Category "${form.name}" updated.`);
      } else {
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
        success(`Category "${form.name}" created.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      error('Failed to save category.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      success(`Deleted category "${name}"`);
    } catch (err) {
      error('Failed to delete category.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-[#C6A15B]" />
            <h1 className="font-serif text-3xl font-bold text-[#3D2E24]">Product Categories</h1>
          </div>
          <p className="text-xs text-[#7B6656] mt-1">
            Organize crochet offerings across flowers, handbags, and accessories.
          </p>
        </div>

        <button
          onClick={() => openForm()}
          className="px-5 py-2.5 bg-[#5A4335] hover:bg-[#3D2E24] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-2xl border border-[#E7DFD7] shadow-xs overflow-hidden flex flex-col justify-between"
          >
            <div className="aspect-[4/3] bg-[#F8F5F0]">
              <img
                src={cat.image_url || '/images/tulip_bouquet.jpg'}
                alt={cat.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 space-y-2">
              <h3 className="font-serif text-lg font-bold text-[#3D2E24]">{cat.name}</h3>
              <p className="text-xs text-[#7B6656] line-clamp-2">{cat.description}</p>
            </div>

            <div className="p-4 pt-2 border-t border-[#E7DFD7] flex items-center justify-end gap-2">
              <button
                onClick={() => openForm(cat)}
                className="p-1.5 text-[#5A4335] hover:text-[#C6A15B] rounded-lg"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="p-1.5 text-[#7B6656] hover:text-[#C96A6A] rounded-lg"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E7DFD7] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7DFD7] pb-3">
              <h3 className="font-serif text-xl font-bold text-[#3D2E24]">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-[#7B6656]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#5A4335] mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5A4335] mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5A4335] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5A4335] mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DFD7] rounded-xl text-[#3D2E24]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E7DFD7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E7DFD7] rounded-xl text-[#7B6656]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A4335] text-white font-bold uppercase rounded-xl hover:bg-[#3D2E24]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
