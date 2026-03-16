import { queryOptions } from '@tanstack/react-query';
import { getInviteMetadata, getMe } from './auth';
import {
  getAdminCoaches,
  getAdminUserDetail,
  getAdminUsers,
  getMyWorkoutPlan,
} from './workout';

export const meQueryOptions = () =>
  queryOptions({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });

export const inviteMetadataQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['auth', 'invite', token],
    queryFn: () => getInviteMetadata(token),
    enabled: Boolean(token.trim()),
    staleTime: 30_000,
    retry: false,
  });

export const myWorkoutQueryOptions = () =>
  queryOptions({
    queryKey: ['workout', 'me'],
    queryFn: getMyWorkoutPlan,
    staleTime: 30_000,
  });

export const adminUsersQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'users'],
    queryFn: getAdminUsers,
    staleTime: 30_000,
  });

export const adminCoachesQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'coaches'],
    queryFn: getAdminCoaches,
    staleTime: 30_000,
  });

export const adminUserDetailQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['admin', 'user-detail', userId],
    queryFn: () => getAdminUserDetail(userId),
    staleTime: 30_000,
  });
