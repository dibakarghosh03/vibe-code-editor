import { SidebarProvider } from "@/components/ui/sidebar";
import { getAllPlaygroundsForUser } from "@/features/dashboard/actions";
import DashboardSidebar from "@/features/dashboard/components/dashboard-sidebar";
import React from "react";

export default async function DashboardLayout({
    children
} : {
    children : React.ReactNode
}) {
    const playgroundData = await getAllPlaygroundsForUser();

    const technologyIconMap: Record<string, string> = {
        REACT: "Zap",
        NEXTJS: "Lightbulb",
        EXPRESS: "Database",
        VUE: "Compass",
        HONO: "FlameIcon",
        ANGULAR: "Terminal",
    };

    const formattedPlagroundData = playgroundData?.map((playground) => ({
        ...playground,
        name: playground?.title,
        starred: playground?.Starmark?.[0]?.isMarked || false,
        icon: technologyIconMap[playground?.template] || "Code2",
    })) || [];

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full overflow-x-hidden">
                <DashboardSidebar initialPlaygroundData={formattedPlagroundData} />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    )
}