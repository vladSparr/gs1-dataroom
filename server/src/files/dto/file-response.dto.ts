export interface FileResponseDto {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  folderId: string;
  dataRoomId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadTicketDto {
  fileId: string;
  name: string;
  uploadUrl: string;
  token: string;
}

export interface DownloadUrlDto {
  url: string;
  expiresAt: string;
}
