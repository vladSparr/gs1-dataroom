import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title: string;
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
}

export function ErrorState({
  title,
  error,
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center text-card-foreground">
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : 'The server did not respond.'}
      </p>
      <Button
        variant="outline"
        className="mt-6"
        onClick={onRetry}
        disabled={retrying}
      >
        {retrying ? 'Retrying…' : 'Try again'}
      </Button>
    </div>
  );
}
