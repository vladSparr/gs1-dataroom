-- CreateEnum
CREATE TYPE "file_status" AS ENUM ('PENDING', 'READY');

-- CreateEnum
CREATE TYPE "share_target_type" AS ENUM ('DATA_ROOM', 'FOLDER', 'FILE');

-- CreateEnum
CREATE TYPE "share_mode" AS ENUM ('PUBLIC_LINK', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "share_role" AS ENUM ('VIEWER', 'EDITOR');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "name" VARCHAR,
    "avatar_url" VARCHAR,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_rooms" (
    "id" TEXT NOT NULL,
    "name" VARCHAR NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "data_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "name" VARCHAR NOT NULL,
    "path" VARCHAR NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "data_room_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "name" VARCHAR NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "mime_type" VARCHAR NOT NULL,
    "storage_key" VARCHAR NOT NULL,
    "status" "file_status" NOT NULL DEFAULT 'PENDING',
    "data_room_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shares" (
    "id" TEXT NOT NULL,
    "token" VARCHAR NOT NULL,
    "target_type" "share_target_type" NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_path" VARCHAR NOT NULL,
    "mode" "share_mode" NOT NULL,
    "role" "share_role" NOT NULL DEFAULT 'VIEWER',
    "data_room_id" TEXT NOT NULL,
    "created_by_id" UUID NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_grants" (
    "id" TEXT NOT NULL,
    "share_id" TEXT NOT NULL,
    "email" VARCHAR NOT NULL,
    "user_id" UUID,
    "role" "share_role" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "data_rooms_owner_id_created_at_idx" ON "data_rooms"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "folders_data_room_id_parent_id_name_idx" ON "folders"("data_room_id", "parent_id", "name");

-- CreateIndex
CREATE INDEX "folders_path_idx" ON "folders"("path");

-- CreateIndex
CREATE UNIQUE INDEX "folders_parent_id_name_key" ON "folders"("parent_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "files_storage_key_key" ON "files"("storage_key");

-- CreateIndex
CREATE INDEX "files_folder_id_status_name_idx" ON "files"("folder_id", "status", "name");

-- CreateIndex
CREATE INDEX "files_data_room_id_status_idx" ON "files"("data_room_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "files_folder_id_name_key" ON "files"("folder_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "shares_token_key" ON "shares"("token");

-- CreateIndex
CREATE INDEX "shares_target_type_target_id_revoked_at_idx" ON "shares"("target_type", "target_id", "revoked_at");

-- CreateIndex
CREATE INDEX "shares_data_room_id_revoked_at_idx" ON "shares"("data_room_id", "revoked_at");

-- CreateIndex
CREATE INDEX "share_grants_email_idx" ON "share_grants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "share_grants_share_id_email_key" ON "share_grants"("share_id", "email");

-- AddForeignKey
ALTER TABLE "data_rooms" ADD CONSTRAINT "data_rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_data_room_id_fkey" FOREIGN KEY ("data_room_id") REFERENCES "data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_data_room_id_fkey" FOREIGN KEY ("data_room_id") REFERENCES "data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_data_room_id_fkey" FOREIGN KEY ("data_room_id") REFERENCES "data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_grants" ADD CONSTRAINT "share_grants_share_id_fkey" FOREIGN KEY ("share_id") REFERENCES "shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_grants" ADD CONSTRAINT "share_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
