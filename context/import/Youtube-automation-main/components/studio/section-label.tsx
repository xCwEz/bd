import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-bold tracking-widest text-red uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
