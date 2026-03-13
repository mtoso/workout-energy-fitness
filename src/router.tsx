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
import { AdminUserWorkoutPage } from './pages/AdminUserWorkoutPage';
import { AdminHomePage } from './pages/AdminHomePage';
import { AdminCoachesPage } from './pages/AdminCoachesPage';

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

const requireAdmin = async () => {
  const user = await requireAuthenticated();

  if (user.role !== 'admin') {
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
  beforeLoad: requireAdmin,
  component: AdminHomePage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  beforeLoad: requireAdmin,
  component: AdminUsersPage,
});

const adminCoachesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/coaches',
  beforeLoad: requireAdmin,
  component: AdminCoachesPage,
});

const adminUserWorkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users/$userId/workout',
  beforeLoad: requireAdmin,
  component: AdminUserWorkoutPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  schedaRoute,
  profileRoute,
  loginRoute,
  acceptInviteRoute,
  adminRoute,
  adminUsersRoute,
  adminCoachesRoute,
  adminUserWorkoutRoute,
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
