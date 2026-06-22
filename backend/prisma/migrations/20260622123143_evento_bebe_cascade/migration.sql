-- DropForeignKey
ALTER TABLE "evento_calendario" DROP CONSTRAINT "evento_calendario_bebe_id_fkey";

-- AddForeignKey
ALTER TABLE "evento_calendario" ADD CONSTRAINT "evento_calendario_bebe_id_fkey" FOREIGN KEY ("bebe_id") REFERENCES "bebe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
