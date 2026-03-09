import DashboardLayout from '@/components/DashboardLayout';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
