"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowPathRoundedSquareIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  FolderIcon,
  FunnelIcon,
  HomeIcon,
  SquaresPlusIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import { NavMain } from "~/components/nav-main";
import { NavSecondary } from "~/components/nav-secondary";
import { TeamSwitcher } from "~/components/team-switcher";
import {
  Sidebar,
  // SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // SidebarRail,
} from "~/components/ui/sidebar";

import Logo from "./logo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

// This is sample data.
const data = {
  teams: [
    {
      name: "My Workspace",
      logo: UserIcon,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: UserIcon,
      plan: "Startup",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "#",
      icon: HomeIcon,
    },
    {
      title: "Funnels",
      url: "#",
      icon: FunnelIcon,
    },
    {
      title: "Leads",
      url: "#",
      icon: BriefcaseIcon,
    },
    {
      title: "Segments",
      url: "#",
      icon: FolderIcon,
      badge: "10",
    },
    {
      title: "Workflows",
      url: "#",
      icon: ArrowPathRoundedSquareIcon,
    },
    {
      title: "Integrations",
      url: "#",
      icon: SquaresPlusIcon,
    },
    {
      title: "Settings",
      url: "#",
      icon: Cog6ToothIcon,
    },
  ],
  navSecondary: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="relative h-full min-h-screen min-w-2xs rounded-tr-2xl rounded-br-2xl px-5 py-6 shadow-[0px_1.2px_3.99px_0px_#00000007,_-3px_4.02px_10.3px_-3px_#00000015_inset]"
      collapsible={"none"}
      {...props}
    >
      <SidebarHeader className="h-full">
        {/* Logo */}
        <Logo />

        {/* Divider */}
        <div className="my-1.5 h-px bg-[#dddddd]" />
        <TeamSwitcher teams={data.teams} />
        <div className="my-1.5 h-px bg-[#dddddd]" />

        <SidebarMenu>
          <SidebarMenuItem key={"getting-started"}>
            <SidebarMenuButton
              asChild
              isActive={true}
              className="!bg-secondary !text-secondary-foreground h-10 w-full px-4 py-1.5 text-base !font-medium"
            >
              <Link href={"/"} className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="!size-5 stroke-2"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span>Getting Started</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="my-1.5 h-px bg-[#dddddd]" />

        <NavMain items={data.navMain} />

        <NavSecondary items={data.navSecondary} />
      </SidebarHeader>

      <div className="absolute bottom-6 left-8 flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarImage src={"/user.jpg"} alt={"Chris Hood"} />
          <AvatarFallback className="rounded-lg">CH</AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left leading-tight">
          <span className="text-secondary truncate font-medium">
            Chris Hood
          </span>
          <span className="text-muted-foreground truncate text-xs">
            hello@example.com
          </span>
        </div>
      </div>
    </Sidebar>
  );
}
