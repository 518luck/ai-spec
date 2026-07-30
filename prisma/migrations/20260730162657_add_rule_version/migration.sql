-- CreateTable
CREATE TABLE "rule"."RuleVersion" (
    "id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "message" TEXT,
    "is_snapshot" BOOLEAN NOT NULL DEFAULT false,
    "snapshot" TEXT,
    "diff" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rule_id" TEXT NOT NULL,
    "editor_id" TEXT NOT NULL,

    CONSTRAINT "RuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RuleVersion_rule_id_version_number_idx" ON "rule"."RuleVersion"("rule_id", "version_number");

-- AddForeignKey
ALTER TABLE "rule"."RuleVersion" ADD CONSTRAINT "RuleVersion_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rule"."Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule"."RuleVersion" ADD CONSTRAINT "RuleVersion_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
