import DashboardForm from "@/components/dashboardform";
import { BASE_URL } from "@/constants/api";

export default function DashboardScreen() {
  return (
    <DashboardForm
      apiUrlbal={`${BASE_URL}/user/expense`}
      apiUrl={`${BASE_URL}/user/create/expense`}
      apiUrldel={`${BASE_URL}/user/delete/expense`}
      role="farmer"
      categories={["fertilizer", "seeds","irrigation", "other"]}
      title="Farmer Dashboard"
    />
  );
}
