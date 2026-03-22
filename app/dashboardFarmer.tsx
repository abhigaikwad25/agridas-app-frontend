import DashboardForm from "@/components/dashboardform";
export default function DashboardScreen() {
  return (
    <DashboardForm
      apiUrlbal="https://agridas-latest.onrender.com/user/expense"
      apiUrl="https://agridas-latest.onrender.com/user/create/expense"
      apiUrldel="https://agridas-latest.onrender.com/user/delete/expense"
      role="mprovider"
      categories={["fertilizer", "seeds","irrigation", "other"]}
      title="Labor Provider Dashboard"
    />
  );
}
