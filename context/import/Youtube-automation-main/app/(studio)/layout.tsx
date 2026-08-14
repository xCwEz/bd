import { AppSidebar } from "@/components/studio/app-sidebar";
import { CreditBadge } from "@/components/studio/credit-badge";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BRAND } from "@/lib/constants";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2.5 border-b border-border bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/85 md:px-4">
          <SidebarTrigger />
          <p className="flex-1 truncate text-sm leading-none text-muted-foreground">
            {BRAND.nicheExample} · local file studio · no database
          </p>
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">{children}</div>
        <CreditBadge />
      </SidebarInset>
    </SidebarProvider>
  );
}
