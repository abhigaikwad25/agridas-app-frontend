import DashboardForm from "@/components/dashboardform";
export default function DashboardScreen() {
  return (
    <DashboardForm
      apiUrlbal="https://krishidas.onrender.com/user/expense"
      apiUrl="https://krishidas.onrender.com/user/create/expense"
      apiUrldel="https://krishidas.onrender.com/user/delete/expense"
      role="farmer"
      categories={["fertilizer", "seeds","irrigation", "other"]}
      title="Farmer Dashboard"
    />
  );
}
