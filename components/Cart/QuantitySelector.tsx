import React from "react";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
}

export default function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
  disabled = false,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center border border-[#D9C4B0] bg-[#FFF9F2] rounded-full px-1.5 py-0.5 md:px-2 md:py-1 select-none w-fit shadow-2xs font-sans">
      <button
        onClick={onDecrease}
        disabled={quantity <= 1 || disabled}
        className="p-1 rounded-full text-[#8B454B] hover:text-[#541B1B] hover:bg-[#EBCDB8]/40 transition-colors disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
        type="button"
        aria-label="Decrease quantity"
      >
        <Minus size={13} />
      </button>
      <span className="w-6 md:w-8 text-center text-xs md:text-sm font-medium font-sans text-[#541B1B]">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        disabled={quantity >= 99 || disabled}
        className="p-1 rounded-full text-[#8B454B] hover:text-[#541B1B] hover:bg-[#EBCDB8]/40 transition-colors disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
        type="button"
        aria-label="Increase quantity"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
