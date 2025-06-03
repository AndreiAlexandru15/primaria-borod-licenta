"use client"

import React from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import { QueryProvider } from "@/components/QueryProvider"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardLayout({ children }) {
    return (
        <QueryProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </QueryProvider>
    );
}