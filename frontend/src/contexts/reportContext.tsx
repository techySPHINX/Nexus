import reportServices from '@/services/reportServices';
import { getErrorMessage } from '@/utils/errorHandler';
import {
  FC,
  createContext,
  ReactNode,
  useState,
  useContext,
  useMemo,
} from 'react';
import { useNotification } from './NotificationContext';
import { CreateReportDto, Report } from '@/types/Report';

type ReportStates = {
  reports: Report[];
  loading: boolean;
};

type ReportContextType = ReportStates & {
  createReport: (data: CreateReportDto) => Promise<Report | null>;
  fetchReports: (opts?: {
    pageSize?: number;
    cursor?: string;
  }) => Promise<Report[]>;
  clearReports: () => void;
  nextCursor?: string | null;
};

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification } = useNotification();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const createReport = useMemo(
    () => async (data: CreateReportDto) => {
      setLoading(true);
      try {
        const created = await reportServices.createReport(data);
        // append to local cache
        setReports((prev) => (created ? [created, ...prev] : prev));
        showNotification?.('Report submitted', 'success');
        return created;
      } catch (err) {
        showNotification?.(getErrorMessage(err), 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showNotification]
  );

  const fetchReports = useMemo(
    () => async (opts?: { pageSize?: number; cursor?: string }) => {
      setLoading(true);
      try {
        const res = await reportServices.getReports(opts);
        // res: { items, nextCursor }
        const items = res?.items || [];
        if (opts?.cursor) {
          // append
          setReports((prev) => [...prev, ...items]);
        } else {
          // replace
          setReports(items);
        }
        setNextCursor(res.nextCursor ?? null);
        return items;
      } catch (err) {
        showNotification?.(getErrorMessage(err), 'error');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showNotification]
  );

  const clearReports = () => {
    setReports([]);
    setLoading(false);
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        loading,
        createReport,
        fetchReports,
        clearReports,
        nextCursor,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReportContext = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReportContext must be used within a ReportProvider');
  }
  return context;
};
