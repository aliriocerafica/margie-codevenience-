import VoidRequestsManagement from "../reports/components/VoidRequestsManagement";
import { PageHeader } from "@/components/ui/PageHeader";

export default function VoidRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Void Requests"
        description="Review and approve void transaction requests from staff"
      />
      <VoidRequestsManagement />
    </div>
  );
}

