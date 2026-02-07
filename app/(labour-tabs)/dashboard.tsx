import DashboardForm from "@/components/dashboardform";
export default function DashboardScreen() {
  return (
    <DashboardForm
      apiUrlbal="https://agridas.onrender.com/laborProvider/expense"
      apiUrl="https://agridas.onrender.com/laborProvider/create/expense"
      apiUrldel="https://agridas.onrender.com/laborProvider/delete/expense"
      role="mprovider"
      categories={["loan", "salary", "other"]}
      title="Labor Provider Dashboard"
    />
  );
}
