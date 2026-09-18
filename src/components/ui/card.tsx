import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  as: Comp = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "article" | "section";
}) {
  return (
    <Comp
      className={cn(
        "rounded-3xl border border-cocoa/8 bg-white shadow-[0_1px_0_rgba(36,20,15,0.04)]",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-5 pt-5 pb-2", className)}>{children}</div>;
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("font-display text-xl text-cocoa", className)}>{children}</h3>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("mt-1 text-sm text-cocoa-soft/75", className)}>{children}</p>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center gap-3 border-t border-cocoa/6 px-5 py-4", className)}>
      {children}
    </div>
  );
}
