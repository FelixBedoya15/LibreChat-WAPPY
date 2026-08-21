import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthContext } from '~/hooks';

export interface DailyUploadStatus {
  isFree: boolean;
  count: number;
  limit: number | null;
  remaining: number | null;
  isLimitReached: boolean;
}

export const DAILY_UPLOAD_STATUS_KEY = ['dailyUploadStatus'];

export const useDailyUploadLimit = () => {
  const { user } = useAuthContext();
  const isFree = user?.role === 'USER';

  const { data, isLoading, refetch } = useQuery<DailyUploadStatus>(
    DAILY_UPLOAD_STATUS_KEY,
    async () => {
      const response = await axios.get<DailyUploadStatus>('/api/files/daily-status');
      return response.data;
    },
    {
      enabled: isFree,
      staleTime: 30000,
      refetchOnWindowFocus: true,
    },
  );

  const isLimitReached = isFree ? (data?.isLimitReached ?? false) : false;
  const remaining = isFree ? (data?.remaining ?? 3) : null;
  const count = isFree ? (data?.count ?? 0) : 0;

  return {
    isFree,
    isLimitReached,
    remaining,
    count,
    limit: isFree ? 3 : null,
    isLoading,
    refetch,
  };
};

export default useDailyUploadLimit;
