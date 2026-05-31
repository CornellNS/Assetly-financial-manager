import { FinanceWorkspace } from "@/components/finance-workspace";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ desktop?: string | string[] }>;
}) {
  const params = await searchParams;
  const desktopParam = Array.isArray(params.desktop) ? params.desktop[0] : params.desktop;

  return <FinanceWorkspace demoMode={desktopParam !== "1"} />;
}
