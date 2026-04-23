import AdminEpisodeDetail from "./AdminEpisodeDetail";

export const metadata = {
  title: "Episode — Admin wikifela",
  robots: "noindex, nofollow",
};

export default async function AdminEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminEpisodeDetail id={id} />;
}
