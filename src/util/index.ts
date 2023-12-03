import { useState } from 'react';
import { useThrottleFn } from 'ahooks';
import { useMount } from 'ahooks';
import { useEventListener } from 'ahooks';
import { useRef } from 'react';
import { useCreation } from 'ahooks';
import { PAGE_SIZE, ROW_GAP, ROW_HEIGHT } from '../const';
import { useMemoizedFn } from 'ahooks';
import { useThrottle } from 'ahooks';

function useThrottleState<T>(initialValue: T, delay = 16): [T, (value: T) => void] {
    const [state, setState] = useState<T>(initialValue);
    const throttledState = useThrottle(state, { wait: delay });
    return [throttledState, setState];
}

/**
 * @returns 返回一些grid动态的显示信息
 */
export function useGridElement<T extends HTMLElement>() {
    const [columnsCount, setColumnsCount] = useThrottleState(0);
    const ref = useRef<T>(null);
    const calceColumnsCount = useMemoizedFn(() => {
        if (ref.current) {
            setColumnsCount((
                window.getComputedStyle(ref.current).gridTemplateColumns?.split(' ')
                    .length ?? 0
            ));
            return;
        }
        setColumnsCount(0);
    });

    const rowCount = useCreation(() => {
        return Math.ceil(PAGE_SIZE / columnsCount);
    }, [columnsCount])

    useEventListener(
        'resize',
        calceColumnsCount,
        { target: window }
    );
    useMount(calceColumnsCount)

    const { y = 0, height = 0, bottom = 0 } = ref.current?.getBoundingClientRect() ?? {};
    return { columnsCount, rowCount, ref, y, height, bottom }
}

export function useScrollElement<T extends HTMLElement>() {
    const [scrollTop, setScrollTop] = useThrottleState(0);
    const ref = useRef<T>(null);

    useEventListener(
        'scroll',
        () => {
            setScrollTop(ref.current?.scrollTop ?? 0);
        },
        { target: ref }
    );
    return { scrollTop, ref }
}

export function useOnce<T extends Function>(callback: T) {
    const ref = useRef(false);
    if (!ref.current) {
        ref.current = true;
        callback();
    }
}

export function calcTotalHeight(rowCount: number, rowHeight: number = ROW_HEIGHT, rowGap: number = ROW_GAP) {
    if (rowCount === 0) return 0;
    return rowCount * rowHeight + (rowCount - 1) * rowGap;
}