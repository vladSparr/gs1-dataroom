/** A file as the client sees it. `size` is a string because it is a BigInt. */
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

/** `POST /api/files/upload-url` — everything the browser needs to PUT bytes. */
export interface UploadTicketDto {
  fileId: string;
  /** The resolved name, which may differ from the one requested. */
  name: string;
  uploadUrl: string;
  token: string;
}

/** `GET /api/files/:id/download-url` — minted per request, never stored. */
export interface DownloadUrlDto {
  url: string;
  expiresAt: string;
}
