import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import { queryClient } from './lib/query-client';
import { isApiError } from './lib/api/client';
import { meQueryOptions } from './lib/api/query-options';
import { AppRoot } from './pages/AppRoot';
import { LoginPage } from './pages/LoginPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { UserAppPage } from './pages/UserAppPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminUserDetailPage } from './pages/AdminUserDetailPage';
import { AdminWorkoutEditorPage } from './pages/AdminWorkoutEditorPage';

const requireAuthenticated = async () => {
  try {
    const data = await queryClient.ensureQueryData(meQueryOptions());
    return data.user;
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      throw redirect({ to: '/login' });
    }

    throw error;
  }
};

const requireManager = async () => {
  const user = await requireAuthenticated();

  if (!user.canManageClients) {
    throw redirect({ to: '/' });
  }

  return user;
};

const rootRoute = createRootRoute({
  component: AppRoot,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const acceptInviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accept-invite',
  component: AcceptInvitePage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: requireAuthenticated,
  component: () => <UserAppPage screen="home" />,
});

const schedaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scheda',
  beforeLoad: requireAuthenticated,
  component: () => <UserAppPage screen="scheda" />,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireAuthenticated,
  component: () => <UserAppPage screen="profile" />,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: async () => {
    await requireManager();
    throw redirect({ to: '/admin/users' });
  },
  component: () => null,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  beforeLoad: requireManager,
  component: AdminUsersPage,
});

const adminUserWorkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users/$userId',
  beforeLoad: requireManager,
  component: AdminUserDetailPage,
});

const adminWorkoutEditorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users/$userId/workouts/$planId',
  beforeLoad: requireManager,
  component: AdminWorkoutEditorPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  schedaRoute,
  profileRoute,
  loginRoute,
  acceptInviteRoute,
  adminRoute,
  adminUsersRoute,
  adminUserWorkoutRoute,
  adminWorkoutEditorRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
