import { useCallback } from 'react';
import { credentialState } from '../atoms/auth';
import { useRecoilValue } from 'recoil';
import axios from '../apis/google';
import useAxiosFunction from './useAxiosFunction';

interface GetCalendarEventRequest {
  calendarId: string;
  eventId: String;
}

const useGetCalendarEvent = () => {
  const { response, error, loading, axiosFetch } = useAxiosFunction();
  const credential = useRecoilValue(credentialState);

  const getCalendarEvent = useCallback(
    async (request: GetCalendarEventRequest) => {
      const getCalendarEventURL =
        '/calendar/v3/calendars/' +
        request.calendarId +
        '/events/' +
        request.eventId;
      axiosFetch({
        axiosInstance: axios,
        method: 'GET',
        url: getCalendarEventURL,
        requestConfig: {
          headers: {
            Authorization: 'Bearer ' + credential?.accessToken,
          },
        },
      });
    },
    [axiosFetch, credential?.accessToken]
  );
  return {
    getCalendarEvent,
    getCalendarEventResponse: response,
    getCalendarEventError: error,
    getCalendarEventLoading: loading,
  };
};

export default useGetCalendarEvent;
