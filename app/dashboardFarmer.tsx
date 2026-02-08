import DashboardForm from "@/components/dashboardform";
export default function DashboardScreen() {
  return (
    <DashboardForm
      apiUrlbal="https://agridas.onrender.com/user/expense"
      apiUrl="https://agridas.onrender.com/user/create/expense"
      apiUrldel="https://agridas.onrender.com/user/delete/expense"
      role="mprovider"
      categories={["fertilizer", "seeds","irrigation", "other"]}
      title="Labor Provider Dashboard"
    />
  );
}
