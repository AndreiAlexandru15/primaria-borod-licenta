import React from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import  AiChatBubble  from "@/components/ai-chat-bubble";

export default function DashboardLayout({ children }) {
    return (
      <>
     <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
        
        {/* Floating Chat Button */}
        <div className="fixed rounded-xl bottom-6 right-6 z-50">
          <AiChatBubble/>
        </div>
      </SidebarProvider>
    </>

    );
}