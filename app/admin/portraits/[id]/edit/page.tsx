import EditPortraitClient from "./EditPortraitClient";

export const metadata = {
  title: "Modifier portrait — Admin wikifela",
  robots: "noindex, nofollow",
};

export default async function EditPortraitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditPortraitClient id={id} />;
}
