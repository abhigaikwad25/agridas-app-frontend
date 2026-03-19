import DashboardForm from "@/components/dashboardform";
import { useLang } from "@/contexts/LanguageContext";

export default function DashboardScreen() {
  const { t } = useLang();

  return (
    <DashboardForm
      apiUrlbal="https://agridas.onrender.com/laborProvider/expense"
      apiUrl="https://agridas.onrender.com/laborProvider/create/expense"
      apiUrldel="https://agridas.onrender.com/laborProvider/delete/expense"
      role="mprovider"
      categories={["loan", "salary", "other"]}
      title={t("labourDashboard.title")}
    />
  );
}