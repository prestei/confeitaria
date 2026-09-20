import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
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

  return NextResponse.json(withIds(orders));
}
