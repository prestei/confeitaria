"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export function ScrollReveal({
  children,
  className,
  as: Comp = "div",
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "ul";
  stagger?: number;
}) {
  const ref = useScrollReveal<HTMLDivElement>({ stagger });

  return (
    <Comp ref={ref as never} className={cn(className)}>
      {children}
    </Comp>
  );
}
