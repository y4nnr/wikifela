-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('facile', 'moyen', 'difficile');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" SERIAL NOT NULL,
    "episodeId" INTEGER,
    "difficulty" "Difficulty" NOT NULL,
    "question" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "wrongAnswers" TEXT[],
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portrait" (
    "id" SERIAL NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "subtitle" TEXT,
    "gender" "Gender" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "takedownAt" TIMESTAMP(3),
    "takedownReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portrait_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizQuestion_episodeId_idx" ON "QuizQuestion"("episodeId");

-- CreateIndex
CREATE INDEX "QuizQuestion_difficulty_idx" ON "QuizQuestion"("difficulty");

-- CreateIndex
CREATE INDEX "Portrait_episodeId_idx" ON "Portrait"("episodeId");

-- CreateIndex
CREATE INDEX "Portrait_gender_idx" ON "Portrait"("gender");

-- CreateIndex
CREATE INDEX "Portrait_takedownAt_idx" ON "Portrait"("takedownAt");

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portrait" ADD CONSTRAINT "Portrait_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
