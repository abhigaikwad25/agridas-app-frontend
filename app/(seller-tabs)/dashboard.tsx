import DashboardForm from "@/components/dashboardform";
export default function DashboardScreen() {
  return (
    <DashboardForm
      apiUrlbal="https://agridas.onrender.com/machine/expense"
      apiUrl="https://agridas.onrender.com/machine/create/expense"
      apiUrldel="https://agridas.onrender.com/machine/delete/expense"
      role="mprovider"
      categories={["maintenance", "loan", "salary", "other"]}
      title="Machine Provider Dashboard"
    />
  );
}
