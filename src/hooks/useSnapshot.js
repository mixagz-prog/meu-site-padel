import { useEffect, useState } from "react";

export default function useSnapshot(subscribeFn, deps = []) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeFn((value) => {
      setData(value);
      setLoading(false);
    });
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { loading, data };
}
