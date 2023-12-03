import { useRequest, useSafeState } from 'ahooks';
import { ENDPOINT, PAGE_SIZE } from '../const';
import axios from 'axios';
import { message } from 'antd';
import { useRef } from 'react';

interface Pokemon {
  name: string;
  url: string;
  id: string;
}

interface PageQueryParama {
  limit: number;
  offset: number;
}

const DEFAULT_PARAMS: PageQueryParama = { limit: PAGE_SIZE, offset: 0 }
const DEFULT_URL = `${ENDPOINT}?limit=${DEFAULT_PARAMS.limit}&offset=${DEFAULT_PARAMS.offset}`
const UNI_SET = new Set();
const filterList = (list: Pokemon[]) => {
  if (!Array.isArray(list)) return [];
  // 丢掉重复数据
  const result = list.filter(({ url }) => !UNI_SET.has(url));
  for (const { url } of list) {
    UNI_SET.add(url);
  }
  return result;
};

export function usePokemonList() {
  const [result, setResult] = useSafeState<{ list: Pokemon[]; count: number }>({
    list: [],
    count: 0,
  });
  const nextUrlRef = useRef<string | null>(null);

  // TODO: 接口没细看，好像只有英文。需要国际化
  const { loading, run, params } = useRequest(
    () => axios.get(nextUrlRef.current ?? DEFULT_URL),
    {
      onSuccess: (res, params) => {
        const { results, count, next } = res?.data ?? {};
        nextUrlRef.current = next;
        setResult({
          list: result.list.concat(filterList(results)),
          count,
        });
      },
      onError: (err) => {
        message.error(err.message ?? 'Request Failed');
        // TODO: log
      },
      debounceWait: 16,
      manual: true
    }
  );
  return {
    /**
     * 查询结果列表
     */
    result,
    /**
     * 是否正在加载
     */
    loading,
    /**
     * 上次请求入参
     */
    params,
    /**
     * 继续请求更多结果，用limit和offset做分页
     */

    loadMore: () => run(),
  };
}
