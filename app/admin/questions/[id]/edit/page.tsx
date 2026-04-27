import EditQuestionClient from "./EditQuestionClient";

export const metadata = {
  title: "Modifier question — Admin wikifela",
  robots: "noindex, nofollow",
};

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditQuestionClient id={id} />;
}
