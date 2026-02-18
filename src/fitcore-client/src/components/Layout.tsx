import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#fafafa]" style={{ marginLeft: '220px' }}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
