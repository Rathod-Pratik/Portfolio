'use client';

import { toast } from 'react-toastify';
import apiClient from '@apiClient';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
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
  const queryClient = useQueryClient();
  const {
    data,
    isLoading: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage = false,
  } = useInfiniteQuery<{ notifications: Notification[]; totalPages: number }>({
    queryKey: ['notifications'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(
        `${GET_NOTIFICATIONS}?page=${pageParam}&limit=20`,
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.totalPages
        ? allPages.length + 1
        : undefined,
  });
  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  const loadMoreRef = useInfiniteScroll({
    hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const markAllRead = async () => {
    try {
      await apiClient.put(MARK_ALL_NOTIFICATIONS_READ);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      toast.error('Unable to mark notifications as read.');
    }
  };

  const clearAll = async () => {
    try {
      await apiClient.delete(CLEAR_NOTIFICATIONS);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      toast.error('Unable to clear notifications.');
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.put(`${MARK_NOTIFICATION_READ}/${id}/read`);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
          <div ref={loadMoreRef} className="h-1" />
          {isFetchingNextPage && (
            <p className="text-center text-gray-400">Loading more notifications...</p>
          )}
        </div>
      )}
    </section>
  );
};

export default Notifications;
