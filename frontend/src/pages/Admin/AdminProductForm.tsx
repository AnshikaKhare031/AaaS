import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, Plus, Trash2 } from "lucide-react";
import { Category, Product } from "../../types";
import {
  getCategories,
  createProduct,
  updateProduct,
  getProducts,
  uploadAdminImage,
} from "../../services/api";
import { useToast } from "../../components/admin/Toast";

interface SpecificationItem {
  label: string;
  value: string;
}

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [featured, setFeatured] = useState(false);
  const [customizable, setCustomizable] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(10);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Dynamic Specifications
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const cats = await getCategories();
        setCategories(cats || []);

        if (cats && cats.length > 0 && !category) {
          setCategory(cats[0].id);
        }

        if (isEdit && id) {
          const prodsRes = await getProducts({ limit: 100 });
          const found = prodsRes.products?.find((p) => p.id === id);
          if (found) {
            setTitle(found.name || "");
            setDescription(found.description || "");
            setPrice(found.price?.toString() || "");
            setCategory(found.category_id || (found.category ? (found.category as any).id : "") || "");
            setFeatured(Boolean(found.is_featured));
            setCustomizable(Boolean(found.is_customizable));
            setStockQuantity(found.stock_quantity ?? 10);
            const img = found.image_url || found.images?.[0]?.image_url;
            if (img) setImagePreview(img);
            if (found.specifications && Array.isArray(found.specifications)) {
              setSpecifications(found.specifications);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load product form data:", err);
        showToast("Failed to load product data.", "error");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [id, isEdit]);

  const addSpecification = () => {
    setSpecifications([...specifications, { label: "", value: "" }]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: "label" | "value", newValue: string) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], [field]: newValue };
    setSpecifications(updated);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !category) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (!imagePreview && !imageFile) {
      showToast("Please select a product image to upload.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = imagePreview || "";

      // 1. Upload image if new file selected
      if (imageFile) {
        showToast("Uploading product image...", "info");
        const uploadRes = await uploadAdminImage(imageFile);
        if (uploadRes?.url) {
          finalImageUrl = uploadRes.url;
        }
      }

      const productPayload: Partial<Product> = {
        name: title.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        category_id: category || (categories[0]?.id ?? undefined),
        stock_quantity: stockQuantity,
        is_featured: featured,
        is_customizable: customizable,
        image_url: finalImageUrl,
        specifications: specifications.filter((s) => s.label.trim() && s.value.trim()),
      };

      if (isEdit && id) {
        await updateProduct(id, productPayload);
        showToast("Product updated successfully!", "success");
      } else {
        await createProduct(productPayload);
        showToast("Product created successfully!", "success");
      }

      navigate("/admin/products");
    } catch (error: any) {
      console.error("Save product error:", error);
      showToast(error?.response?.data?.detail || error.message || "Failed to save product.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-16 flex flex-col justify-center items-center gap-3 text-slate-400 font-sans">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-sm">Loading creation details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans">
      {/* Header Back Button */}
      <div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-slate-500 hover:text-accent transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to products</span>
        </Link>
        <h1 className="font-serif text-3xl font-semibold tracking-wide text-slate-900 mt-4">
          {isEdit ? "Edit Product" : "Add Product"}
        </h1>
        <p className="text-sm font-sans text-slate-500 font-light mt-1">
          {isEdit
            ? "Modify the properties and details of your handmade creation."
            : "Create a new handmade creation in the store inventory."}
        </p>
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200/80 rounded-2xl p-6 lg:p-8 shadow-xs space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Details */}
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Product Name *
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hand-crocheted Floral Top"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-sm text-slate-800 transition-colors"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-sm text-slate-800 transition-colors bg-white cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label htmlFor="price" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Price (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-medium text-sm">₹</span>
                <input
                  id="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 850"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-sm text-slate-800 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Image Upload & Preview */}
          <div className="space-y-6 flex flex-col">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              {isEdit ? "Product Image" : "Product Image *"}
            </span>
            <div className="flex-grow flex flex-col justify-center items-center">
              {imagePreview ? (
                <div className="relative w-full aspect-square max-w-[240px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  <label
                    htmlFor="image-upload"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    Replace Image
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="w-full h-full aspect-square max-w-[240px] border-2 border-dashed border-slate-200 hover:border-accent/40 rounded-2xl flex flex-col justify-center items-center p-6 text-center cursor-pointer transition-colors"
                >
                  <Upload size={32} className="text-slate-400 mb-3" />
                  <span className="text-xs font-semibold text-slate-600 block">Click to Upload</span>
                  <span className="text-[10px] text-slate-400 font-light block mt-1">
                    PNG, JPG, JPEG up to 5MB
                  </span>
                </label>
              )}
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            Description *
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Introduce the piece, mention what makes it special, and include size/care instructions."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-sm text-slate-800 transition-colors resize-none"
          />
        </div>

        {/* Checkbox settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          {/* Featured */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4.5 h-4.5 border border-slate-300 rounded-sm text-accent focus:ring-accent accent-accent"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-slate-800 block">Featured Creation</span>
              <span className="text-xs text-slate-400 font-light block">Display on home page collections.</span>
            </div>
          </label>

          {/* Customizable */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={customizable}
                onChange={(e) => setCustomizable(e.target.checked)}
                className="w-4.5 h-4.5 border border-slate-300 rounded-sm text-accent focus:ring-accent accent-accent"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-slate-800 block">Customizable</span>
              <span className="text-xs text-slate-400 font-light block">
                Let customers request custom colors/names on WhatsApp.
              </span>
            </div>
          </label>
        </div>

        {/* Dynamic Specifications Editor */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Product Specifications
              </h3>
              <p className="text-[11px] text-slate-400 font-light mt-0.5">
                Add details like Material, Size, Care Instructions, etc.
              </p>
            </div>
            <button
              type="button"
              onClick={addSpecification}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-accent/20 hover:border-accent text-accent hover:bg-accent/5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Specification</span>
            </button>
          </div>

          {specifications.length === 0 ? (
            <p className="text-xs text-slate-400 font-light italic py-2">
              No specifications added yet. Add some to display on the product page.
            </p>
          ) : (
            <div className="space-y-3">
              {specifications.map((spec, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) => handleSpecChange(index, "label", e.target.value)}
                      placeholder="Label (e.g. Material)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-xs text-slate-800 transition-colors"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                      placeholder="Value (e.g. 100% Organic Cotton)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-accent font-sans text-xs text-slate-800 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-colors cursor-pointer"
                    title="Remove specification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-6 border-t border-slate-100">
          <Link
            to="/admin/products"
            className="px-6 py-3.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3.5 bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-wider uppercase rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-75 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isEdit ? "Saving Changes..." : "Saving Product..."}</span>
              </>
            ) : (
              <span>{isEdit ? "Save Changes" : "Save Product"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminProductFormPage;
