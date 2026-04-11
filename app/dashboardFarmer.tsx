import DashboardForm from "@/components/dashboardform";
export default function DashboardScreen() {
  return (
    <DashboardForm
      apiUrlbal="https://agridas-latest.onrender.com/user/expense"
      apiUrl="https://agridas-latest.onrender.com/user/create/expense"
      apiUrldel="https://agridas-latest.onrender.com/user/delete/expense"
      role="farmer"
      categories={["fertilizer", "seeds","irrigation", "other"]}
      title="Farmer Dashboard"
    />
  );
}
