import { EquipmentForm } from '@/components/equipment/EquipmentForm';

export default function NewEquipmentPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add New Equipment</h1>
        <EquipmentForm />
      </div>
    </div>
  );
}