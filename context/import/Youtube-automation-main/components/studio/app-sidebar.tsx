"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  FolderOpen,
  PlusCircle,
  Radio,
  Settings,
} from "lucide-react";

import { ThemeToggle } from "@/components/portal/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Create", href: "/create", icon: PlusCircle },
  { title: "Library", href: "/library", icon: FolderOpen },
  { title: "Channel", href: "/channel", icon: Radio },
  { title: "Setup", href: "/setup", icon: Settings },
] as const;

const navButtonClass =
  "rounded-cta transition-[background-color,box-shadow,color] duration-300";

const navButtonActiveClass =
  "bg-[var(--cta)]! text-white! shadow-none hover:bg-[var(--cta)]! hover:text-white! data-active:bg-[var(--cta)]! data-active:text-white! data-active:font-semibold active:bg-[var(--cta)]! active:text-white!";

const brandMarkClass =
  "portal-icon-tile size-8 shrink-0 p-1.5 shadow-cta";

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn(brandMarkClass, className)} aria-hidden>
      <Clapperboard className="size-full text-white" />
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12 shrink-0 justify-center gap-0 border-b border-sidebar-border p-2">
        <div className="flex w-full items-center gap-1.5 group-data-[collapsible=icon]:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <BrandMark />
            <div className="min-w-0">
              <span className="block truncate text-sm leading-tight font-bold text-sidebar-foreground">
                {BRAND.name}
              </span>
              <span className="block truncate text-[11px] leading-tight font-medium text-primary">
                {BRAND.subtitle}
              </span>
            </div>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>

        <Link
          href="/create"
          className="hidden self-center group-data-[collapsible=icon]:block"
          aria-label={BRAND.name}
        >
          <BrandMark />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-red uppercase">
            Studio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        navButtonClass,
                        active && navButtonActiveClass,
                      )}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:hidden">
        <div className="flex items-start gap-2 rounded-cta px-2 py-2">
          <Clapperboard className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            {BRAND.credit} ·{" "}
            <a
              href={BRAND.handleUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {BRAND.handle}
            </a>
            <br />
            Niche: {BRAND.nicheExample}
            <br />
            <a
              href={BRAND.resourcesUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              More resources
            </a>
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
