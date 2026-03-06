import { queryOptions } from '@tanstack/react-query';
import { getMe } from './auth';
import {
  getAdminUserWorkoutPlan,
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

export const adminWorkoutQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['admin', 'workout', userId],
    queryFn: () => getAdminUserWorkoutPlan(userId),
    staleTime: 30_000,
  });
