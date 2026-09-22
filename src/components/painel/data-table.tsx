import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Shell padrão de tabelas do painel. */
export function DataTable({
  children,
  className,
  minWidth = "720px",
  footer,
}: {
  children: ReactNode;
  className?: string;
  minWidth?: string;
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded border border-[#E8E2DE] bg-white shadow-[0_1px_2px_rgba(45,41,38,0.04)]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
      {footer}
    </div>
  );
}

export function DataTableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[#E8E2DE] bg-[#FBF7F2] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8C8682]">
      {children}
    </thead>
  );
}

export function DataTableHead({
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3.5 font-semibold",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[#F0EBE7]">{children}</tbody>;
}

export function DataTableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "bg-white transition",
        onClick && "cursor-pointer",
        "hover:bg-[#FDF8F5]",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function DataTableFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EBE7] bg-white px-4 py-3 text-sm text-[#8C8682]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataTablePagination({
  page,
  pageCount,
  onPageChange,
  summary,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  summary: string;
}) {
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(pageCount, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from(
    { length: end - start + 1 },
    (_, i) => start + i,
  );

  return (
    <DataTableFooter>
      <p>{summary}</p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-[#8C8682] transition hover:bg-[#F5F0ED] disabled:opacity-40"
            aria-label="Página anterior"
          >
            ‹
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded text-[13px] font-semibold transition",
                p === page
                  ? "bg-[#F3D5C8] text-[#3D2B1F]"
                  : "text-[#8C8682] hover:bg-[#F5F0ED]",
              )}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-[#8C8682] transition hover:bg-[#F5F0ED] disabled:opacity-40"
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>
      ) : null}
    </DataTableFooter>
  );
}

/** Avatar circular com iniciais — padrão de coluna de pessoa. */
export function TableAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3D5C8] text-[11px] font-bold uppercase tracking-wide text-[#3D2B1F]",
        className,
      )}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
}
