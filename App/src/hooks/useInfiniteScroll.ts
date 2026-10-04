import { useEffect, useRef } from "react";

type UseInfiniteScrollOptions = {
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
};

export const useInfiniteScroll = ({
  hasNextPage,
  isLoading,
  onLoadMore,
}: UseInfiniteScrollOptions) => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasNextPage, isLoading, onLoadMore]);

  return loadMoreRef;
};
