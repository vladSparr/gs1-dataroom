import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createShare,
  listShares,
  listSharedWithMe,
  revokeShare,
} from '@/api/shares';
import type { ShareMode, ShareTargetType } from '@/api/types';

export interface ShareTarget {
  type: ShareTargetType;
  id: string;
  name: string;
}

function required(target: ShareTarget | null): ShareTarget {
  if (!target) {
    throw new Error('No share target selected');
  }
  return target;
}

export function useShares(target: ShareTarget | null) {
  return useQuery({
    queryKey: ['shares', target?.type, target?.id],
    queryFn: () => {
      const { type, id } = required(target);
      return listShares(type, id);
    },
    enabled: target !== null,
  });
}

export function useCreateShare(target: ShareTarget | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { mode: ShareMode; emails?: string[] }) => {
      const { type, id } = required(target);
      return createShare({
        targetType: type,
        targetId: id,
        mode: input.mode,
        emails: input.emails,
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['shares', target?.type, target?.id],
      }),
  });
}

export function useRevokeShare(target: ShareTarget | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => revokeShare(shareId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['shares', target?.type, target?.id],
      }),
  });
}

export function useSharedWithMe() {
  return useQuery({
    queryKey: ['shared-with-me'],
    queryFn: () => listSharedWithMe(),
  });
}
