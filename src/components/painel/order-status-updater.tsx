"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

export function OrderStatusUpdater({
  orderId,
  current,
  labels,
  onUpdated,
}: {
  orderId: string;
  current: string;
  labels: Record<string, string>;
  onUpdated?: (status: string) => void;
}) {
  const [status, setStatus] = useState(current);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setStatus(current);
  }, [current, orderId]);

  async function save(next: string) {
    setStatus(next);
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      setStatus(current);
      toast({ title: "Não foi possível atualizar", tone: "error" });
      return;
    }
    toast({ title: "Status atualizado", tone: "success" });
    onUpdated?.(next);
    if (!onUpdated) router.refresh();
  }

  return (
    <select
      className="input !py-2 text-sm"
      value={status}
      disabled={loading}
      onChange={(e) => save(e.target.value)}
    >
      {Object.entries(labels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
