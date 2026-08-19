/** Shape returned by `GET /api/me`. */
export interface MeResponseDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}
