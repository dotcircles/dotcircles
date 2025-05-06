// app/dashboard/layout.tsx
import Sidebar from '@/app/components/layout/Sidebar'; // Adjust path

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      {/* Add pl-64 (same as sidebar width) to main content */}
      <main className="flex-1 overflow-y-auto pl-64">
        {/* Add padding within the main content area */}
        <div className="p-4 md:p-8">
            {children}
        </div>
      </main>
    </div>
  );
}