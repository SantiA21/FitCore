import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#fafafa] min-w-0">
        <div className="p-4 pt-20 md:p-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
