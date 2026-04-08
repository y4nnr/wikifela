-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" SERIAL NOT NULL,
    "game" TEXT NOT NULL,
    "difficulty" TEXT,
    "nickname" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderboardEntry_game_difficulty_idx" ON "LeaderboardEntry"("game", "difficulty");
