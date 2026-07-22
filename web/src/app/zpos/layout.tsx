import ZPOSLayout from '@/modules/zpos/components/ZPOSLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ZPOSLayout>
      {children}
    </ZPOSLayout>
  );
}
