import { useCallback } from 'react';
import { credentialState } from '../atoms/auth';
import { useRecoilValue } from 'recoil';
import axios from '../apis/google';
import useAxiosFunction from './useAxiosFunction';

const useGetCalendarList = () => {
  const { response, error, loading, axiosFetch } = useAxiosFunction();
  const credential = useRecoilValue(credentialState);

  const getCalendarList = useCallback(async () => {
    axiosFetch({
      axiosInstance: axios,
      method: 'GET',
      url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      requestConfig: {
        headers: {
          Authorization: 'Bearer ' + credential?.accessToken,
        },
      },
    });
  }, [axiosFetch, credential?.accessToken]);
  return {
    getCalendarList,
    getCalendarListResponse: response,
    getCalendarListError: error,
    getCalendarListLoading: loading,
  };
};

export default useGetCalendarList;
