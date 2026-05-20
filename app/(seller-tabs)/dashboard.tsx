import DashboardForm from "@/components/dashboardform";
import { useLang } from "@/contexts/LanguageContext";

export default function DashboardScreen() {
  const { t } = useLang();

  return (
    <DashboardForm
      apiUrlbal="https://krishidas.onrender.com/machine/expense"
      apiUrl="https://krishidas.onrender.com/machine/create/expense"
      apiUrldel="https://krishidas.onrender.com/machine/delete/expense"
      role="mprovider"
      categories={["maintenance", "loan", "salary", "other"]}
      title={t("dashboard.machineProvider")}
    />
  );
}