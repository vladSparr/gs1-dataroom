import { Fragment } from 'react';
import { FolderOpenIcon } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ContentsTable,
  ContentsTableSkeleton,
} from '@/components/ContentsTable';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import type { FileItem, PublicFolderView } from '@/api/types';

interface ReadOnlyFolderViewProps {
  view: PublicFolderView | undefined;
  loading: boolean;
  onOpenFolder: (folderId: string) => void;
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
}

export function ReadOnlyFolderView({
  view,
  loading,
  onOpenFolder,
  onPreviewFile,
  onDownloadFile,
}: ReadOnlyFolderViewProps) {
  if (loading || !view) {
    return (
      <div>
        <Skeleton className="h-5 w-64" />
        <div className="mt-6">
          <ContentsTableSkeleton />
        </div>
      </div>
    );
  }

  const isEmpty = view.folders.length === 0 && view.files.length === 0;

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          {view.breadcrumbs.map((crumb, index) => {
            const isCurrent = index === view.breadcrumbs.length - 1;

            return (
              <Fragment key={crumb.id}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isCurrent ? (
                    <BreadcrumbPage className="max-w-[16rem] truncate">
                      {crumb.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="max-w-[12rem] cursor-pointer truncate"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenFolder(crumb.id)}
                      >
                        {crumb.name}
                      </button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6">
        {isEmpty ? (
          <EmptyState
            icon={FolderOpenIcon}
            title="This folder is empty"
            description="There is nothing shared inside it yet."
          />
        ) : (
          <ContentsTable
            folders={view.folders}
            files={view.files}
            onOpenFolder={onOpenFolder}
            onPreviewFile={onPreviewFile}
            onDownloadFile={onDownloadFile}
          />
        )}
      </div>
    </div>
  );
}
