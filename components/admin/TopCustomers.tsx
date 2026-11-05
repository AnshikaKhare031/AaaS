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
    <div className="bg-[#FFF9F2] border border-[#D9C4B0] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center border-b border-[#D9C4B0] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#541B1B]">Devoted Patrons</h3>
            <p className="text-xs text-[#8B454B] font-sans mt-0.5">Top 5 clients ranked by total spend</p>
          </div>
        </div>

        <div className="divide-y divide-[#D9C4B0]/50 pr-1">
          {customers.length === 0 ? (
            <div className="py-8 text-center text-[#8B454B] font-sans text-xs font-light">
              No patron orders registered yet.
            </div>
          ) : (
            customers.map((item, index) => (
              <div key={index} className="py-3 flex items-center justify-between gap-4 first:pt-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 bg-[#F8EEE2] border border-[#D9C4B0] rounded-full flex items-center justify-center text-[#541B1B] shrink-0">
                    <User size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#541B1B] text-xs font-sans truncate max-w-[150px]">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-[#8B454B] font-sans">
                      {item.orders} {item.orders === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-[#541B1B] font-sans">
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
