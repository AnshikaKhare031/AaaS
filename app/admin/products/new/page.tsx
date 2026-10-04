"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/admin/Toast";
import { ArrowLeft, Upload, Loader2, Plus, Trash2 } from "lucide-react";
import { Specification } from "@/types/product";

export default function AddProductPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<"mdf" | "pouch" | "magnet" | "rakhis" | "crochet">("mdf");
  const [featured, setFeatured] = useState(false);
  const [customizable, setCustomizable] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specifications, setSpecifications] = useState<Specification[]>([]);

  const addSpecification = () => {
    setSpecifications([...specifications, { label: "", value: "" }]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: "label" | "value", newValue: string) => {
    const updatedSpecs = [...specifications];
    updatedSpecs[index] = {
      ...updatedSpecs[index],
      [field]: newValue,
    };
    setSpecifications(updatedSpecs);
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
    if (!title || !description || !price || !category) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (!imageFile) {
      showToast("Please select a product image to upload.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload image to Supabase Storage via backend API
      showToast("Uploading creation photography...", "info");
      const uploadFormData = new FormData();
      uploadFormData.append("file", imageFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        throw new Error(uploadErr.error || "Failed to upload image.");
      }

      const { url: imageUrl } = await uploadRes.json();

      // 2. Save product to Supabase Database via backend API
      const productData = {
        title,
        description,
        price: Number(price),
        category,
        image_url: imageUrl,
        featured,
        customizable,
        specifications: specifications.filter((spec) => spec.label.trim() && spec.value.trim()),
      };

      const productRes = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!productRes.ok) {
        const productErr = await productRes.json().catch(() => ({}));
        throw new Error(productErr.error || "Failed to create product.");
      }

      showToast("Creation added to atelier successfully!", "success");
      
      // Redirect back to products view
      router.push("/admin/products");
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Failed to create product.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Back Button */}
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#5C745F] hover:text-[#25382E] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to creations</span>
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl text-[#25382E] mt-3">Add Atelier Creation</h1>
        <p className="text-xs font-sans text-[#5C745F] font-light mt-1">
          Catalog a new handmade piece into the atelier collection.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-[#FFFAF1] border border-[#E5DACB] p-6 lg:p-8 rounded-2xl shadow-xs space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Details */}
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                Creation Name *
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ivory Woven Tote"
                className="w-full px-4 py-2.5 border border-[#E5DACB] bg-[#F8F2E7] font-sans text-xs text-[#25382E] focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] placeholder-[#5C745F]/50 transition-colors rounded-lg"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as "mdf" | "pouch" | "magnet" | "rakhis" | "crochet")}
                className="w-full px-4 py-2.5 border border-[#E5DACB] bg-[#F8F2E7] font-sans text-xs text-[#25382E] focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors cursor-pointer rounded-lg"
              >
                <option value="crochet">Crochet</option>
                <option value="mdf">MDF Board Art</option>
                <option value="pouch">Hand-painted Pouch</option>
                <option value="magnet">Fridge Magnet</option>
                <option value="rakhis">Handmade Rakhi</option>
              </select>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label htmlFor="price" className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
                Price (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#5C745F] font-medium text-xs">₹</span>
                <input
                  id="price"
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1450"
                  className="w-full pl-8 pr-4 py-2.5 border border-[#E5DACB] bg-[#F8F2E7] font-sans text-xs text-[#25382E] focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] placeholder-[#5C745F]/50 transition-colors rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Image Upload & Preview */}
          <div className="space-y-2 flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
              Creation Photography *
            </span>
            <div className="flex-grow flex flex-col justify-center items-center">
              {imagePreview ? (
                <div className="relative w-full aspect-square max-w-[240px] overflow-hidden border border-[#E5DACB] bg-[#F8F2E7] rounded-xl group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  <label
                    htmlFor="image-upload"
                    className="absolute inset-0 bg-[#25382E]/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#FFFAF1] text-[10px] font-medium uppercase tracking-[0.15em] cursor-pointer"
                  >
                    Replace Image
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="w-full h-full aspect-square max-w-[240px] border border-dashed border-[#E5DACB] hover:border-[#EC8D99] bg-[#F8F2E7] rounded-xl flex flex-col justify-center items-center p-6 text-center cursor-pointer transition-colors"
                >
                  <Upload size={28} className="text-[#5C745F] group-hover:text-[#EC8D99] mb-2.5" />
                  <span className="text-xs font-medium text-[#25382E] block">Select Photography</span>
                  <span className="text-[9px] text-[#5C745F] font-light block mt-1">PNG, JPG, WEBP up to 5MB</span>
                </label>
              )}
              <input
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
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">
            Story & Description *
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the artisan craft, stitch pattern, materials, and tactile details..."
            className="w-full px-4 py-2.5 border border-[#E5DACB] bg-[#F8F2E7] font-sans text-xs text-[#25382E] focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] placeholder-[#5C745F]/50 transition-colors resize-none rounded-lg"
          />
        </div>

        {/* Checkbox settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E5DACB]">
          {/* Featured */}
          <label className="flex items-start gap-3 p-4 border border-[#E5DACB] bg-[#F8F2E7] hover:border-[#EC8D99] transition-colors cursor-pointer group rounded-xl">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 border border-[#E5DACB] rounded accent-[#25382E]"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-[#25382E] block">Featured Creation</span>
              <span className="text-[10px] text-[#5C745F] font-light block">Showcase in signature boutique collections.</span>
            </div>
          </label>

          {/* Customizable */}
          <label className="flex items-start gap-3 p-4 border border-[#E5DACB] bg-[#F8F2E7] hover:border-[#EC8D99] transition-colors cursor-pointer group rounded-xl">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={customizable}
                onChange={(e) => setCustomizable(e.target.checked)}
                className="w-4 h-4 border border-[#E5DACB] rounded accent-[#25382E]"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-[#25382E] block">Bespoke / Customizable</span>
              <span className="text-[10px] text-[#5C745F] font-light block">Enable patron requests for custom yarn hues or sizes.</span>
            </div>
          </label>
        </div>

        {/* Dynamic Specifications Editor */}
        <div className="space-y-4 pt-6 border-t border-[#E5DACB]">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#5C745F]">Craft Specifications</h3>
              <p className="text-[10px] text-[#5C745F]/70 font-light mt-0.5">Specify yarn material, dimensions, care advice, etc.</p>
            </div>
            <button
              type="button"
              onClick={addSpecification}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#25382E]/30 hover:border-[#25382E] text-[#25382E] hover:bg-[#F6C4C2]/20 text-xs font-medium rounded-full transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Specification</span>
            </button>
          </div>

          {specifications.length === 0 ? (
            <p className="text-xs text-[#5C745F] font-light italic py-1">No specifications added yet. Add items to render on the product detail view.</p>
          ) : (
            <div className="space-y-2.5">
              {specifications.map((spec, index) => (
                <div key={index} className="flex gap-2.5 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) => handleSpecChange(index, "label", e.target.value)}
                      placeholder="Label (e.g. Yarn)"
                      className="w-full px-3 py-2 border border-[#E5DACB] bg-[#F8F2E7] font-sans text-xs text-[#25382E] focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors rounded-lg"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                      placeholder="Value (e.g. 100% Organic Cotton)"
                      className="w-full px-3 py-2 border border-[#E5DACB] bg-[#F8F2E7] font-sans text-xs text-[#25382E] focus:outline-none focus:border-[#EC8D99] focus:bg-[#FFFAF1] transition-colors rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="text-[#C96A6A] hover:bg-[#C96A6A]/10 p-2 rounded-lg transition-colors cursor-pointer"
                    title="Remove specification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-6 border-t border-[#E5DACB]">
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-[#E5DACB] hover:border-[#25382E] text-xs font-medium tracking-[0.15em] text-[#5C745F] hover:text-[#25382E] hover:bg-[#F8F2E7] uppercase rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#25382E] hover:bg-[#405F4C] text-[#FFFAF1] text-xs font-medium tracking-[0.15em] uppercase rounded-full shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin text-[#F5C842]" />
                <span>Saving Creation...</span>
              </>
            ) : (
              <span>Save Creation</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
