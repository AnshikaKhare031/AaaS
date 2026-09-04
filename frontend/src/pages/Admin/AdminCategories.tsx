import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Loader2, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Category } from "../../types";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../../services/api";
import { slugify } from "../../utils/helpers";
import { useToast } from "../../components/admin/Toast";

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const { showToast } = useToast();

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load categories.", "error");
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
        description: cat.description || "",
      });
    } else {
      setEditingCategory(null);
      setForm({
        name: "",
        slug: "",
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Category name is required.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim(),
      };

      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? updated : c)));
        showToast("Category updated successfully!", "success");
      } else {
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
        showToast("Category created successfully!", "success");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || err.message || "Failed to save category.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      showToast("Category deleted successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || err.message || "Failed to delete category.", "error");
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-wide text-slate-900">Categories</h1>
          <p className="text-sm font-sans text-slate-500 font-light mt-1">
            Organize creations into searchable store product collections.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl shadow-xs transition-all cursor-pointer font-sans"
        >
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Main Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col justify-center items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-light text-sm">
            No categories created yet. Click &quot;Add Category&quot; to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Slug</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800 flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        <Layers size={14} />
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      {c.slug}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {c.description || "—"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openForm(c)}
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(c)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => !isSaving && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 z-10 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-slate-800">
                    {editingCategory ? "Edit Category" : "Add Category"}
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Categorize handmade products for customer browsing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="cat-name" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Category Name *
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name,
                        slug: prev.slug ? prev.slug : slugify(name),
                      }));
                    }}
                    placeholder="e.g. Crochet Bouquets"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-sm text-slate-800 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cat-slug" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Slug
                  </label>
                  <input
                    id="cat-slug"
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g. crochet-bouquets"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-sm text-slate-800 transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cat-desc" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Description
                  </label>
                  <textarea
                    id="cat-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description of this category..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-sm text-slate-800 transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="px-4 py-2.5 text-xs font-semibold tracking-wider text-slate-500 hover:bg-slate-50 border border-slate-200 uppercase rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 text-xs font-semibold tracking-wider text-white bg-accent hover:bg-accent/90 uppercase rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Category</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => !isDeleting && setCategoryToDelete(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 z-10 relative overflow-hidden"
            >
              <h3 className="font-serif text-xl font-semibold text-slate-800">Delete Category?</h3>
              <p className="text-slate-500 text-sm font-sans font-light mt-2 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-800">&quot;{categoryToDelete.name}&quot;</span>?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold tracking-wider text-slate-500 hover:bg-slate-50 border border-slate-200 uppercase rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold tracking-wider text-white bg-rose-600 hover:bg-rose-700 uppercase rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminCategoriesPage;
