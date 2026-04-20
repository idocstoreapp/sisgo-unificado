/**
 * Quote Detail Page
 */

import { QuoteDetail } from "@/presentation/components/quotes/QuoteDetail";

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  return <QuoteDetail quoteId={params.id} />;
}
