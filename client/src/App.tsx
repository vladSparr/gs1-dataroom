import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/auth/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { FolderPage } from '@/pages/FolderPage';
import { LoginPage } from '@/pages/LoginPage';
import { RoomRedirectPage } from '@/pages/RoomRedirectPage';
import { RoomsPage } from '@/pages/RoomsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<RoomsPage />} />
          <Route path="/rooms/:roomId" element={<RoomRedirectPage />} />
          <Route path="/folders/:folderId" element={<FolderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
