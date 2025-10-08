"use client";

import React, { useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { AppSidebar } from "~/components/app-sidebar";

const Header = ({ title }: { title: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <header>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{title}</h1>

        {/* Mobile Menu Button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[100vw] p-0">
            <AppSidebar isMobile onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      <div className="my-3 h-px w-full bg-[#EBEDF3]"></div>
    </header>
  );
};

export default Header;
