"use client";

import React from "react";
import { User } from "lucide-react";

interface CustomerSpending {
  name: string;
  orders: number;
  spent: number;
}

interface TopCustomersProps {
  customers: CustomerSpending[];
}

export default function TopCustomers({ customers }: TopCustomersProps) {
  return (
    <div className="bg-[#FFFAF1] border border-[#E5DACB] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center border-b border-[#E5DACB] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#25382E]">Devoted Patrons</h3>
            <p className="text-xs text-[#5C745F] font-sans mt-0.5">Top 5 clients ranked by total spend</p>
          </div>
        </div>

        <div className="divide-y divide-[#E5DACB]/50 pr-1">
          {customers.length === 0 ? (
            <div className="py-8 text-center text-[#5C745F] font-sans text-xs font-light">
              No patron orders registered yet.
            </div>
          ) : (
            customers.map((item, index) => (
              <div key={index} className="py-3 flex items-center justify-between gap-4 first:pt-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 bg-[#F8F2E7] border border-[#E5DACB] rounded-full flex items-center justify-center text-[#5C745F] shrink-0">
                    <User size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#25382E] text-xs font-sans truncate max-w-[150px]">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-[#5C745F] font-sans">
                      {item.orders} {item.orders === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-[#25382E] font-sans">
                    ₹{item.spent.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
