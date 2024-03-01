import { useState, useEffect, useCallback } from 'react';

interface config {
  axiosInstance: any;
  method: string;
  url: string;
  requestConfig: {};
}

const useAxiosFunction = () => {
  const [response, setResponse] = useState<any>();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [controller, setController] = useState<AbortController>();

  const axiosFetch = useCallback(async (configObj: config) => {
    const { axiosInstance, method, url, requestConfig = {} } = configObj;

    try {
      setLoading(true);
      const ctrl = new AbortController();
      setController(ctrl);
      const res = await axiosInstance[method.toLowerCase()](url, {
        ...requestConfig,
        signal: ctrl.signal,
      });
      setResponse(res.data);
    } catch (err: any) {
      console.log(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    //useEffectCleanup function
    return () => controller?.abort();
  }, [controller]);

  return { response, error, loading, axiosFetch };
};

export default useAxiosFunction;
