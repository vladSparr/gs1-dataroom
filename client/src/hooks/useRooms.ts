import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRoom,
  deleteRoom,
  getRoom,
  listRooms,
  renameRoom,
} from '@/api/rooms';

export function useRooms() {
  return useQuery({ queryKey: ['rooms'], queryFn: () => listRooms() });
}

export function useRoom(roomId: string | undefined) {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoom(roomId as string),
    enabled: Boolean(roomId),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createRoom(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useRenameRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameRoom(id, name),
    onSuccess: async () => {
      // The root folder is renamed with the room, so breadcrumbs go stale too.
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
}
