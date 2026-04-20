"use client";
import { OrderWizardProvider } from "./OrderWizardContext";
import OrderWizardContent from "./OrderWizardContent";

interface OrderWizardProps {
  technicianId: string;
  onSaved?: () => void;
}

export default function OrderWizard({ technicianId, onSaved = () => {} }: OrderWizardProps) {
  return (
    <OrderWizardProvider technicianId={technicianId} onSaved={onSaved}>
      <OrderWizardContent onSaved={onSaved} />
    </OrderWizardProvider>
  );
}

