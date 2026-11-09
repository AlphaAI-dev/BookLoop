import { Logo } from "@/components/layout/logo";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <MainNav />
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
