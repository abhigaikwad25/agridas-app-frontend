import DashboardForm from "@/components/dashboardform";
import { BASE_URL } from "@/constants/api";
import { useLang } from "@/contexts/LanguageContext";

export default function DashboardScreen() {
  const { t } = useLang();

  return (
    <DashboardForm
      apiUrlbal={`${BASE_URL}/laborProvider/expense`}
      apiUrl={`${BASE_URL}/laborProvider/create/expense`}
      apiUrldel={`${BASE_URL}/laborProvider/delete/expense`}
      role="lprovider"
      categories={["loan", "salary", "other"]}
      title={t("labourDashboard.title")}
    />
  );
}