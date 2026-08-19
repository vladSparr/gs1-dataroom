import { Navigate, useParams } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { ErrorState } from '@/components/ErrorState';
import { useRoom } from '@/hooks/useRooms';

export function RoomRedirectPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useRoom(roomId);

  if (room.isError) {
    return (
      <ErrorState
        title="Could not open this data room"
        error={room.error}
        onRetry={() => void room.refetch()}
        retrying={room.isFetching}
      />
    );
  }

  if (room.isSuccess) {
    return <Navigate to={`/folders/${room.data.rootFolderId}`} replace />;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      Opening data room…
    </div>
  );
}
