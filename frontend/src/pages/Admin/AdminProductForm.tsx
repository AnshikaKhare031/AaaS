import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  X,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Save,
  Image as ImageIcon,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Category, Product } from '../../types';
import {
  getCategories,
  getProducts,
  createProduct,
  updateProduct,
  uploadAdminImage,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface SpecificationItem {
  id: string;
  label: string;
  value: string;
}

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  // Toggles
  const [isFeatured, setIsFeatured] = useState(false);
  const [isCustomizable, setIsCustomizable] = useState(false);

  // Image Upload State
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic Specifications
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([]);

  // Load Categories & Product Details if Edit Mode
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const cats = await getCategories();
        setCategories(cats);

        if (isEditMode && id) {
          const prods = await getProducts();
          const target = prods.products.find((p: Product) => p.id === id);
          if (target) {
            setName(target.name);
            setCategoryId(target.category_id || (target.category ? target.category.id : ''));
            setPrice(target.price);
            setDescription(target.description || '');
            setIsFeatured(target.is_featured ?? false);
            setIsCustomizable(target.is_customizable ?? false);

            if (target.images && target.images.length > 0) {
              setImageUrl(target.images[0].image_url);
            }

            if (target.specifications && target.specifications.length > 0) {
              setSpecifications(
                target.specifications.map((s, idx) => ({
                  id: `spec-${idx}-${Date.now()}`,
                  label: s.label || '',
                  value: s.value || '',
                }))
              );
            } else if (target.material || target.care_instructions) {
              const defaultSpecs: SpecificationItem[] = [];
              if (target.material) {
                defaultSpecs.push({ id: `spec-mat`, label: 'Material', value: target.material });
              }
              if (target.care_instructions) {
                defaultSpecs.push({ id: `spec-care`, label: 'Care Instructions', value: target.care_instructions });
              }
              setSpecifications(defaultSpecs);
            }
          }
        }
      } catch (err) {
        toastError('Failed to load form resources');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [id, isEditMode]);

  // Image upload handling
  const handleProcessFile = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError(`File "${file.name}" exceeds 5MB limit. Please upload a smaller image.`);
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toastError('Only PNG, JPG, and JPEG images up to 5MB are supported.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadAdminImage(file);
      if (res.url) {
        setImageUrl(res.url);
        success('Product image uploaded successfully');
      } else {
        toastError('Upload failed: No image URL returned');
      }
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageUrl('');
  };

  // Specifications Handlers
  const handleAddSpecification = () => {
    setSpecifications([
      ...specifications,
      { id: `spec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, label: '', value: '' },
    ]);
  };

  const handleUpdateSpecification = (id: string, field: 'label' | 'value', text: string) => {
    setSpecifications(
      specifications.map((s) => (s.id === id ? { ...s, [field]: text } : s))
    );
  };

  const handleDeleteSpecification = (id: string) => {
    setSpecifications(specifications.filter((s) => s.id !== id));
  };

  // Form Submit & Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Strict Validation
    if (!name.trim()) {
      toastError('Product Name is required');
      return;
    }

    if (!categoryId) {
      toastError('Please select a Category');
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      toastError('Please enter a valid Price (INR) greater than 0');
      return;
    }

    if (!imageUrl) {
      toastError('Product Image is required. Please upload an image.');
      return;
    }

    if (!description.trim()) {
      toastError('Description is required');
      return;
    }

    // Filter out empty specification rows
    const cleanedSpecifications = specifications
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      .filter((s) => s.label.length > 0 || s.value.length > 0);

    const payload: any = {
      name: name.trim(),
      category_id: categoryId,
      price: Number(price),
      description: description.trim(),
      image_urls: [imageUrl],
      images: [imageUrl],
      image: imageUrl,
      image_url: imageUrl,
      product_image: imageUrl,
      is_featured: isFeatured,
      is_customizable: isCustomizable,
      specifications: cleanedSpecifications,
    };

    setIsSaving(true);
    try {
      if (isEditMode && id) {
        await updateProduct(id, payload);
        success('Product updated successfully');
      } else {
        await createProduct(payload);
        success('Product created successfully');
      }
      navigate('/admin/products');
    } catch (err: any) {
      console.error('Failed to save product:', err);
      toastError(
        err.response?.data?.detail || 'Failed to save product. Please check required fields.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#C6A15B] animate-spin" />
        <p className="text-xs text-[#7B6656]">Loading product editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7B6656] hover:text-[#3D2E24] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2E24]">
            {isEditMode ? 'Edit Product' : 'Add Product'}
          </h1>
          <p className="text-xs text-[#7B6656]">
            {isEditMode
              ? 'Update details, pricing, image, and specifications for this creation.'
              : 'Add a new handcrafted piece to your boutique catalog.'}
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#E7DFD7] p-6 sm:p-8 shadow-xs space-y-6"
      >
        {/* ======================================================== */}
        {/* TOP GRID: Two Columns on desktop, single column on mobile */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Name, Category, Price */}
          <div className="space-y-5">
            {/* 1. Product Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A4335] mb-1.5">
                Product Name <span className="text-[#C96A6A]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ganesh MDF Welcome Board"
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-sm text-[#3D2E24] placeholder-[#A39282] focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white transition-all"
              />
            </div>

            {/* 2. Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A4335] mb-1.5">
                Category <span className="text-[#C96A6A]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-sm text-[#3D2E24] focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white transition-all"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Price (INR) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A4335] mb-1.5">
                Price (INR) <span className="text-[#C96A6A]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7B6656]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 850"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-sm font-semibold text-[#3D2E24] placeholder-[#A39282] focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Product Image Upload Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5A4335] mb-1.5">
              Product Image <span className="text-[#C96A6A]">*</span>
            </label>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!imageUrl ? (
              /* Dropzone */
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed ${
                  isDragging ? 'border-[#C6A15B] bg-[#EADCCF]/30' : 'border-[#D1C5B8] bg-[#FAF7F2]/60'
                } hover:border-[#C6A15B] hover:bg-[#FAF7F2] rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] gap-2`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-[#C6A15B] animate-spin" />
                    <p className="text-xs font-bold text-[#5A4335]">Uploading image...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#EADCCF]/60 text-[#5A4335] flex items-center justify-center mb-1">
                      <UploadCloud className="w-6 h-6 text-[#C6A15B]" />
                    </div>
                    <p className="text-xs font-bold text-[#3D2E24]">
                      Click to Upload <span className="font-normal text-[#7B6656]">or drag and drop</span>
                    </p>
                    <p className="text-[11px] text-[#7B6656]">PNG, JPG, JPEG up to 5MB</p>
                  </>
                )}
              </div>
            ) : (
              /* Image Preview Box */
              <div className="border border-[#E7DFD7] rounded-2xl p-3 bg-[#FAF7F2] space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-white border border-[#E7DFD7] aspect-4/3 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/tulip_bouquet.jpg';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-[#5C734B] font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Image ready
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs font-bold text-[#5A4335] hover:text-[#C6A15B] underline cursor-pointer disabled:opacity-50"
                  >
                    Replace Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* FULL-WIDTH SECTION: Description */}
        {/* ======================================================== */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#5A4335] mb-1.5">
            Description <span className="text-[#C96A6A]">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Introduce the piece, mention what makes it special, and include size/care instructions."
            className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-sm text-[#3D2E24] placeholder-[#A39282] focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white transition-all leading-relaxed"
          />
        </div>

        {/* ======================================================== */}
        {/* FULL-WIDTH SECTION: Toggles / Checkbox Cards */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* 1. Featured Creation Card */}
          <div
            onClick={() => setIsFeatured(!isFeatured)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
              isFeatured
                ? 'bg-[#FAF7F2] border-[#C6A15B] shadow-2xs'
                : 'bg-white border-[#E7DFD7] hover:border-[#D1C5B8]'
            }`}
          >
            <div className="pt-0.5">
              {isFeatured ? (
                <CheckSquare className="w-5 h-5 text-[#C6A15B]" />
              ) : (
                <Square className="w-5 h-5 text-[#7B6656]" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[#3D2E24]">Featured Creation</p>
              <p className="text-xs text-[#7B6656] mt-0.5">Display on home page collections.</p>
            </div>
          </div>

          {/* 2. Customizable Card */}
          <div
            onClick={() => setIsCustomizable(!isCustomizable)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
              isCustomizable
                ? 'bg-[#FAF7F2] border-[#C6A15B] shadow-2xs'
                : 'bg-white border-[#E7DFD7] hover:border-[#D1C5B8]'
            }`}
          >
            <div className="pt-0.5">
              {isCustomizable ? (
                <CheckSquare className="w-5 h-5 text-[#C6A15B]" />
              ) : (
                <Square className="w-5 h-5 text-[#7B6656]" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[#3D2E24]">Customizable</p>
              <p className="text-xs text-[#7B6656] mt-0.5">
                Let customers request custom colors/names on WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FULL-WIDTH SECTION: Product Specifications */}
        {/* ======================================================== */}
        <div className="pt-3 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E7DFD7] pb-2.5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#5A4335]">
                Product Specifications
              </h2>
              <p className="text-xs text-[#7B6656]">
                Add details like Material, Size, Care Instructions, etc.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddSpecification}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#EADCCF]/60 text-[#5A4335] text-xs font-bold rounded-xl border border-[#E7DFD7] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Specification
            </button>
          </div>

          {/* Empty State */}
          {specifications.length === 0 ? (
            <div className="p-4 bg-[#FAF7F2]/50 rounded-xl border border-dashed border-[#E7DFD7] text-center">
              <p className="text-xs text-[#7B6656] italic">
                No specifications added yet. Add some to display on the product page.
              </p>
            </div>
          ) : (
            /* Dynamic Rows */
            <div className="space-y-2.5 pt-1">
              {specifications.map((spec) => (
                <div key={spec.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={spec.label}
                    onChange={(e) => handleUpdateSpecification(spec.id, 'label', e.target.value)}
                    placeholder="Label (e.g. Material)"
                    className="w-1/3 px-3.5 py-2 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] placeholder-[#A39282] focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white transition-all"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateSpecification(spec.id, 'value', e.target.value)}
                    placeholder="Value (e.g. Pine MDF Wood)"
                    className="flex-1 px-3.5 py-2 bg-[#FAF7F2] border border-[#E7DFD7] rounded-xl text-xs text-[#3D2E24] placeholder-[#A39282] focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteSpecification(spec.id)}
                    className="p-2 text-[#7B6656] hover:text-[#C96A6A] hover:bg-[#C96A6A]/10 rounded-xl transition-colors cursor-pointer"
                    title="Remove specification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* FORM FOOTER ACTIONS */}
        {/* ======================================================== */}
        <div className="border-t border-[#E7DFD7] pt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-5 py-2.5 bg-white hover:bg-[#FAF7F2] text-[#7B6656] hover:text-[#3D2E24] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#E7DFD7] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5A4335] hover:bg-[#3D2E24] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <span>Save Product</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
