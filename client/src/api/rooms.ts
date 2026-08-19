import { apiFetch } from '@/lib/api';
import type { Page, Room } from './types';

export function listRooms(cursor?: string): Promise<Page<Room>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<Page<Room>>(`/rooms${query}`);
}

export function getRoom(roomId: string): Promise<Room> {
  return apiFetch<Room>(`/rooms/${roomId}`);
}

export function createRoom(name: string): Promise<Room> {
  return apiFetch<Room>('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function renameRoom(roomId: string, name: string): Promise<Room> {
  return apiFetch<Room>(`/rooms/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function deleteRoom(roomId: string): Promise<void> {
  return apiFetch<void>(`/rooms/${roomId}`, { method: 'DELETE' });
}
