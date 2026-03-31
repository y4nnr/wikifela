-- CreateTable
CREATE TABLE "EpisodeLocation" (
    "id" SERIAL NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "communeName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EpisodeLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EpisodeLocation_episodeId_idx" ON "EpisodeLocation"("episodeId");

-- CreateIndex
CREATE INDEX "EpisodeLocation_department_idx" ON "EpisodeLocation"("department");

-- AddForeignKey
ALTER TABLE "EpisodeLocation" ADD CONSTRAINT "EpisodeLocation_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
