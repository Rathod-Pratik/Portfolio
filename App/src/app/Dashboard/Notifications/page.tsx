'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '@apiClient';
import {
  CLEAR_NOTIFICATIONS,
  GET_NOTIFICATIONS,
  MARK_ALL_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_READ,
} from '@api';

type Notification = {
  _id: string;
  type: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const response = await apiClient.get(
        `${GET_NOTIFICATIONS}?page=1&limit=100`,
      );
      setNotifications(response.data.data.notifications);
    } catch {
      toast.error('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const markAllRead = async () => {
    try {
      await apiClient.put(MARK_ALL_NOTIFICATIONS_READ);
      await loadNotifications();
    } catch {
      toast.error('Unable to mark notifications as read.');
    }
  };

  const clearAll = async () => {
    try {
      await apiClient.delete(CLEAR_NOTIFICATIONS);
      setNotifications([]);
    } catch {
      toast.error('Unable to clear notifications.');
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.put(`${MARK_NOTIFICATION_READ}/${id}/read`);
      setNotifications((items) =>
        items.map((item) => (item._id === id ? { ...item, isRead: true } : item)),
      );
    } catch {
      toast.error('Unable to update notification.');
    }
  };

  return (
    <section className="mx-auto max-w-4xl p-4 text-white sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => void markAllRead()} className="rounded bg-blue-600 px-3 py-2 hover:bg-blue-500">
            Mark all read
          </button>
          <button type="button" onClick={() => void clearAll()} className="rounded bg-red-600 px-3 py-2 hover:bg-red-500">
            Clear all
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-gray-400">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-400">No notifications.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification._id}
              type="button"
              onClick={() => !notification.isRead && void markRead(notification._id)}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
            >
              <div className="flex items-start gap-3">
                {!notification.isRead && <span className="mt-2 h-2 w-2 rounded-full bg-orange-400" />}
                <div>
                  <p className="font-semibold">{notification.title}</p>
                  <p className="mt-1 text-sm text-gray-300">{notification.message}</p>
                  <p className="mt-2 text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default Notifications;
