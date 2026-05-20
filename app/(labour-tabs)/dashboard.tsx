import DashboardForm from "@/components/dashboardform";
import { useLang } from "@/contexts/LanguageContext";

export default function DashboardScreen() {
  const { t } = useLang();

  return (
    <DashboardForm
      apiUrlbal="https://krishidas.onrender.com/laborProvider/expense"
      apiUrl="https://krishidas.onrender.com/laborProvider/create/expense"
      apiUrldel="https://krishidas.onrender.com/laborProvider/delete/expense"
      role="lprovider"
      categories={["loan", "salary", "other"]}
      title={t("labourDashboard.title")}
    />
  );
}