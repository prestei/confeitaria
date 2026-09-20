import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { isAbandonedOnlineCheckout } from "@/lib/utils";
import { Order } from "@/models/Order";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const orders = await Order.find({ storeId: session.user.storeId })
    .sort({ createdAt: -1 })
    .lean();

  // Esconde checkout MP abandonado (cliente não chegou a pagar).
  const visible = orders.filter((o) => !isAbandonedOnlineCheckout(o));

  return NextResponse.json(withIds(visible));
}
