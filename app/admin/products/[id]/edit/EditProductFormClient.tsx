"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "@/types/product";
import { useToast } from "@/components/admin/Toast";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { getCanonicalCategoryName } from "@/lib/constants/categories";

interface EditProductFormClientProps {
  product: Product;
}

export default function EditProductFormClient({ product }: EditProductFormClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(product.name || product.title || "");
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.price ? product.price.toString() : "");
  
  const initialCategory = (getCanonicalCategoryName(product.category) || "Handbags") as "Handbags" | "Keychains" | "Accessories";
  const [category, setCategory] = useState<"Handbags" | "Keychains" | "Accessories">(initialCategory);

  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!name.trim() || !description.trim() || !price || !category) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      showToast("Price must be a positive number.", "error");
      return;
    }

    setIsSubmitting(true);
    let newImageUrl = product.image_url;

    try {
      // 1. If a new image is selected, upload it via backend API
      if (imageFile) {
        showToast("Uploading new creation photography...", "info");
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

        const { url } = await uploadRes.json();
        newImageUrl = url;
      }

      // 2. Save changes to Database via backend API
      const updatedData = {
        name: name.trim(),
        description: description.trim(),
        price: numericPrice,
        category,
        image_url: newImageUrl,
      };

      const productRes = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!productRes.ok) {
        const productErr = await productRes.json().catch(() => ({}));
        throw new Error(productErr.error || "Failed to update product.");
      }

      showToast("Creation updated successfully!", "success");
      
      // Redirect back to products view
      router.push("/admin/products");
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Failed to update product.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-[#3B241C]">
      {/* Header Back Button */}
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#8B454B] hover:text-[#541B1B] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to creations</span>
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl text-[#541B1B] mt-3">Edit Atelier Creation</h1>
        <p className="text-xs font-sans text-[#3B241C]/80 font-light mt-1">
          Refine details and pricing for this piece.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-[#FFF9F2] border border-[#D9C4B0] p-6 lg:p-8 rounded-2xl shadow-xs space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Details */}
          <div className="space-y-5">
            {/* Title / Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
                Creation Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ivory Woven Tote"
                className="w-full px-4 py-2.5 border border-[#D9C4B0] bg-[#FFF9F2] font-sans text-xs text-[#3B241C] focus:outline-none focus:border-[#541B1B] focus:ring-1 focus:ring-[#541B1B] placeholder-[#3B241C]/40 transition-colors rounded-lg"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as "Handbags" | "Keychains" | "Accessories")}
                className="w-full px-4 py-2.5 border border-[#D9C4B0] bg-[#FFF9F2] font-sans text-xs text-[#3B241C] focus:outline-none focus:border-[#541B1B] focus:ring-1 focus:ring-[#541B1B] transition-colors cursor-pointer rounded-lg"
              >
                <option value="Handbags">Handbags</option>
                <option value="Keychains">Keychains</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label htmlFor="price" className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
                Price (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#8B454B] font-medium text-xs">₹</span>
                <input
                  id="price"
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1450"
                  className="w-full pl-7 pr-3 py-2.5 border border-[#D9C4B0] bg-[#FFF9F2] font-sans text-xs text-[#3B241C] focus:outline-none focus:border-[#541B1B] focus:ring-1 focus:ring-[#541B1B] placeholder-[#3B241C]/40 transition-colors rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Image Upload & Preview */}
          <div className="space-y-2 flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
              Creation Photography
            </span>
            <div className="flex-grow flex flex-col justify-center items-center">
              {imagePreview ? (
                <div className="relative w-full aspect-square max-w-[240px] overflow-hidden border border-[#D9C4B0] bg-[#F8EEE2] rounded-xl group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  <label
                    htmlFor="image-upload"
                    className="absolute inset-0 bg-[#3B1018]/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#FFF9F2] text-[10px] font-medium uppercase tracking-[0.15em] cursor-pointer"
                  >
                    Replace Image
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="w-full h-full aspect-square max-w-[240px] border border-dashed border-[#D9C4B0] hover:border-[#541B1B] bg-[#F8EEE2]/60 rounded-xl flex flex-col justify-center items-center p-6 text-center cursor-pointer transition-colors"
                >
                  <Upload size={28} className="text-[#8B454B] group-hover:text-[#541B1B] mb-2.5" />
                  <span className="text-xs font-medium text-[#541B1B] block">Select Photography</span>
                  <span className="text-[9px] text-[#3B241C]/70 font-light block mt-1">PNG, JPG, WEBP up to 5MB</span>
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
          <label htmlFor="description" className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#8B454B]">
            Story & Description *
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the artisan craft, stitch pattern, materials, and tactile details..."
            className="w-full px-4 py-2.5 border border-[#D9C4B0] bg-[#FFF9F2] font-sans text-xs text-[#3B241C] focus:outline-none focus:border-[#541B1B] focus:ring-1 focus:ring-[#541B1B] placeholder-[#3B241C]/40 transition-colors resize-none rounded-lg"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-6 border-t border-[#D9C4B0]">
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-[#D9C4B0] hover:border-[#541B1B] text-xs font-medium tracking-[0.15em] text-[#3B241C] hover:text-[#541B1B] hover:bg-[#F8EEE2] uppercase rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] text-xs font-medium tracking-[0.15em] uppercase rounded-full shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin text-[#FFF9F2]" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
