import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/auth/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { FolderPage } from '@/pages/FolderPage';
import { LoginPage } from '@/pages/LoginPage';
import { PublicSharePage } from '@/pages/PublicSharePage';
import { RoomRedirectPage } from '@/pages/RoomRedirectPage';
import { RoomsPage } from '@/pages/RoomsPage';
import { SharedWithMePage } from '@/pages/SharedWithMePage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Deliberately outside RequireAuth: a public link has to open for a
          signed-out visitor. Wrapping these is the classic way the feature
          silently stops working. */}
      <Route path="/s/:token" element={<PublicSharePage />} />
      <Route path="/s/:token/f/:folderId" element={<PublicSharePage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<RoomsPage />} />
          <Route path="/shared-with-me" element={<SharedWithMePage />} />
          <Route path="/rooms/:roomId" element={<RoomRedirectPage />} />
          <Route path="/folders/:folderId" element={<FolderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
