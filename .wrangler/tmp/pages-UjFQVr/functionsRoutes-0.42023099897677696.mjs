import { onRequestPost as __api_admin_users__userId__workouts__planId__activate_ts_onRequestPost } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/[userId]/workouts/[planId]/activate.ts"
import { onRequestGet as __api_admin_users__userId__workouts__planId__ts_onRequestGet } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/[userId]/workouts/[planId].ts"
import { onRequestPut as __api_admin_users__userId__workouts__planId__ts_onRequestPut } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/[userId]/workouts/[planId].ts"
import { onRequestPost as __api_admin_users__userId__checkins_ts_onRequestPost } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/[userId]/checkins.ts"
import { onRequestPut as __api_admin_users__userId__coach_ts_onRequestPut } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/[userId]/coach.ts"
import { onRequestGet as __api_admin_users__userId__detail_ts_onRequestGet } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/[userId]/detail.ts"
import { onRequestGet as __api_admin_users__userId__workouts_index_ts_onRequestGet } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/[userId]/workouts/index.ts"
import { onRequestPost as __api_admin_users__userId__workouts_index_ts_onRequestPost } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/[userId]/workouts/index.ts"
import { onRequestPost as __api_auth_login_email_ts_onRequestPost } from "/Users/mattia/dev/workout-energy-fitness/functions/api/auth/login/email.ts"
import { onRequestPost as __api_auth_login_google_ts_onRequestPost } from "/Users/mattia/dev/workout-energy-fitness/functions/api/auth/login/google.ts"
import { onRequestPost as __api_auth_signup_email_ts_onRequestPost } from "/Users/mattia/dev/workout-energy-fitness/functions/api/auth/signup/email.ts"
import { onRequestPost as __api_auth_signup_google_ts_onRequestPost } from "/Users/mattia/dev/workout-energy-fitness/functions/api/auth/signup/google.ts"
import { onRequestGet as __api_admin_coaches_index_ts_onRequestGet } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/coaches/index.ts"
import { onRequestGet as __api_admin_users_index_ts_onRequestGet } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/index.ts"
import { onRequestPost as __api_admin_users_index_ts_onRequestPost } from "/Users/mattia/dev/workout-energy-fitness/functions/api/admin/users/index.ts"
import { onRequestPost as __api_auth_logout_ts_onRequestPost } from "/Users/mattia/dev/workout-energy-fitness/functions/api/auth/logout.ts"
import { onRequestGet as __api_auth_me_ts_onRequestGet } from "/Users/mattia/dev/workout-energy-fitness/functions/api/auth/me.ts"
import { onRequestGet as __api_workout_plan_me_ts_onRequestGet } from "/Users/mattia/dev/workout-energy-fitness/functions/api/workout-plan/me.ts"

export const routes = [
    {
      routePath: "/api/admin/users/:userId/workouts/:planId/activate",
      mountPath: "/api/admin/users/:userId/workouts/:planId",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_users__userId__workouts__planId__activate_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/users/:userId/workouts/:planId",
      mountPath: "/api/admin/users/:userId/workouts",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_users__userId__workouts__planId__ts_onRequestGet],
    },
  {
      routePath: "/api/admin/users/:userId/workouts/:planId",
      mountPath: "/api/admin/users/:userId/workouts",
      method: "PUT",
      middlewares: [],
      modules: [__api_admin_users__userId__workouts__planId__ts_onRequestPut],
    },
  {
      routePath: "/api/admin/users/:userId/checkins",
      mountPath: "/api/admin/users/:userId",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_users__userId__checkins_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/users/:userId/coach",
      mountPath: "/api/admin/users/:userId",
      method: "PUT",
      middlewares: [],
      modules: [__api_admin_users__userId__coach_ts_onRequestPut],
    },
  {
      routePath: "/api/admin/users/:userId/detail",
      mountPath: "/api/admin/users/:userId",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_users__userId__detail_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/users/:userId/workouts",
      mountPath: "/api/admin/users/:userId/workouts",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_users__userId__workouts_index_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/users/:userId/workouts",
      mountPath: "/api/admin/users/:userId/workouts",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_users__userId__workouts_index_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/login/email",
      mountPath: "/api/auth/login",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_email_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/login/google",
      mountPath: "/api/auth/login",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_google_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/signup/email",
      mountPath: "/api/auth/signup",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_signup_email_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/signup/google",
      mountPath: "/api/auth/signup",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_signup_google_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/coaches",
      mountPath: "/api/admin/coaches",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_coaches_index_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/users",
      mountPath: "/api/admin/users",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_users_index_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/users",
      mountPath: "/api/admin/users",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_users_index_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_ts_onRequestGet],
    },
  {
      routePath: "/api/workout-plan/me",
      mountPath: "/api/workout-plan",
      method: "GET",
      middlewares: [],
      modules: [__api_workout_plan_me_ts_onRequestGet],
    },
  ]