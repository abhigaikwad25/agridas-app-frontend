import DashboardForm from "@/components/dashboardform";
import { BASE_URL } from "@/constants/api";
import { useLang } from "@/contexts/LanguageContext";

export default function DashboardScreen() {
  const { t } = useLang();

  return (
    <DashboardForm
      apiUrlbal={`${BASE_URL}/machine/expense`}
      apiUrl={`${BASE_URL}/machine/create/expense`}
      apiUrldel={`${BASE_URL}/machine/delete/expense`}
      role="mprovider"
      categories={["maintenance", "loan", "salary", "other"]}
      title={t("dashboard.machineProvider")}
    />
  );
}