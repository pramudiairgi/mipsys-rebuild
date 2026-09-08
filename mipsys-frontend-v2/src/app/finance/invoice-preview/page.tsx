import { Suspense } from 'react';
import InvoicePreview from '@/src/features/finance/invoice-preview/InvoicePreviewPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-stone-700">Memuat preview invoice...</div>}>
      <InvoicePreview />
    </Suspense>
  );
}
