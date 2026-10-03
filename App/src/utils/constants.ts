export const HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:5000";

// Auth endpoints
export const LOGIN = "auth/login";
export const LOGIN_VERIFY_OTP = "auth/login-verify";
export const LOGOUT = "auth/logout";
export const FORGOT_PASSWORD = "auth/forgot-password";
export const VERIFY_OTP = "auth/verify-otp";
export const RESET_PASSWORD = "auth/reset-password";
export const CHECK_AUTH = "auth/check";
export const CONTACT_FORM = `${HOST}/api/form`;

// File endpoints
export const FETCH_PDF = `${HOST}/api/pdf`;
export const FETCH_PROJECT = `${HOST}/api/project/code`;
export const FETCH_CODE = `${HOST}/api/project/code`;

// Language endpoints
export const GET_LANGUAGE = "language/getlanguage";
export const CREATE_LANGUAGE = "language/createlanguage";
export const UPDATE_LANGUAGE = "language/editlanguage";
export const DELETE_LANGUAGE = "language/deletelanguage";

// Skill endpoints
export const CREATE_SKILL = "skills";
export const GET_SKILL = "skills";
export const UPDATE_SKILL = "skills";
export const DELETE_SKILL = "skills";

// Note endpoints
export const GET_NOTES = "note/getnotes";
export const CREATE_NOTES = "note/createNote";
export const EDIT_NOTES = "note/editNote";
export const DELETE_NOTES = "note/deleteNote";

// Contact endpoints
export const GET_CONTACT_OPTIONS = "contact/options";
export const GET_CONTACT = "contact/getcontact";
export const CREATE_CONTACT = "contact/createcontact";
export const UPDATE_CONTACT_STATUS = "contact/updatecontactstatus";
export const DELETE_CONTACT = "contact/deletecontact";

// CV endpoints
export const GET_CV = "CV";
export const CREATE_CV = "CV";
export const UPDATE_CV = "CV";

// Project endpoints
export const CREATE_PROJECT = "project";
export const GET_PROJECT = "project";
export const EDIT_PROJECT = "project";
export const DELETE_PROJECT = "project";
export const GET_PROJECT_DATA = "project";

// Blog endpoints
export const CREATE_BLOG = "blogs/create";
export const GET_BLOG = "blogs/get";
export const GET_BLOG_DETAILS = "blogs";
export const UPDATE_BLOG = "blogs";
export const DELETE_BLOG = "blogs";

// Admin endpoints
export const GET_ADMIN_DETAIL = "states";
export const INCREMENT_VIEW_URL = "states/view";

// Experience endpoints
export const CREATE_EXPERIENCE = "experiences";
export const GET_EXPERIENCE = "experiences";
export const GET_EXPERIENCE_DETAILS = "experiences";
export const UPDATE_EXPERIENCE = "experiences";
export const DELETE_EXPERIENCE = "experiences";

// Hero endpoints
export const GET_HERO = "hero";
export const UPDATE_HERO = "hero";

// Logger endpoints
export const GET_LOGS = "logger";
export const DELETE_LOG = "logger";
export const CLEAR_LOGS = "logger/all";

// Notification endpoints
export const GET_NOTIFICATIONS = "notifications";
export const MARK_NOTIFICATION_READ = "notifications";
export const MARK_ALL_NOTIFICATIONS_READ = "notifications/read-all";
export const DELETE_NOTIFICATION = "notifications";
export const CLEAR_NOTIFICATIONS = "notifications/all";

// Expertise endpoints
export const CREATE_EXPERTISE = "expertise";
export const GET_EXPERTISE = "expertise";
export const UPDATE_EXPERTISE = "expertise";
export const DELETE_EXPERTISE = "expertise";

// About endpoints
export const GET_ABOUT = "about";
export const UPDATE_ABOUT = "about";