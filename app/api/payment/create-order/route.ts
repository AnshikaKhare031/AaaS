import { NextRequest } from "next/server";
import { handleCreatePaymentOrder } from "@/lib/payment/create-order";

export async function POST(req: NextRequest) {
  return handleCreatePaymentOrder(req);
}

