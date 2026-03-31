-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "season" INTEGER,
    "episode" INTEGER,
    "airDate" TIMESTAMP(3),
    "description" TEXT,
    "keywords" TEXT[],
    "wikiSummary" TEXT,
    "searchVector" tsvector,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Episode_searchVector_idx" ON "Episode" USING GIN ("searchVector");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_season_episode_key" ON "Episode"("season", "episode");
