-- CreateTable
CREATE TABLE "_TemplateAdmins" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TemplateAdmins_AB_unique" ON "_TemplateAdmins"("A", "B");

-- CreateIndex
CREATE INDEX "_TemplateAdmins_B_index" ON "_TemplateAdmins"("B");

-- AddForeignKey
ALTER TABLE "_TemplateAdmins" ADD CONSTRAINT "_TemplateAdmins_A_fkey" FOREIGN KEY ("A") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemplateAdmins" ADD CONSTRAINT "_TemplateAdmins_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
