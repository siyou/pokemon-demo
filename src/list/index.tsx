import React from 'react';
import { useCreation } from 'ahooks';
import Card from '../component/card';
import styled from '@emotion/styled';
import { usePokemonList } from './help';
import { Spin } from 'antd';
import { calcTotalHeight, useGridElement, useScrollElement } from '../util';
import { PAGE_SIZE, ROW_GAP, ROW_HEIGHT } from '../const';
import { useDebounceEffect } from 'ahooks';

const Container = styled.div<{ scrollHidden: boolean }>`
  height: 100%;
  overflow: ${(props) => (props.scrollHidden ? 'hidden' : 'auto')};
`;

const V_PADDING = 40;

const StyledSpin = styled(Spin)`
  width: 100%;
  grid-column: 1 / -1;
`;

const Grid = styled.div<{ y: number }>`
  display: grid;
  place-items: center;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-auto-rows: ${ROW_HEIGHT}px;
  justify-items: center;
  gap: ${ROW_GAP}px;
  padding: ${V_PADDING}px 20px;
  transform: ${(props) => `translateY(${props.y}px)`};
`;

const ScrollArea = styled.div<{ scrollAreaHeight: number }>`
  overflow: hidden;
  height: ${(props) => props.scrollAreaHeight}px;
`;

// 数据量不是非常大，扔内存里不要紧，只做了向下滚动到边界加载数据和虚拟滚动。
// 完整的话应该做成只持有固定数量量的数据，上下滚动到边界都要去请求数据。
export default function List() {
  const { result, loading, loadMore } = usePokemonList();
  const { list, count } = result;

  const { scrollTop, ref: scrollRef } = useScrollElement<HTMLDivElement>();
  // 列数、行数是动态自适应的
  const {
    ref: gridRef,
    columnsCount,
    bottom,
  } = useGridElement<HTMLDivElement>();

  const allRowCount = useCreation(() => {
    return Math.ceil(count / columnsCount) ?? 0;
  }, [count, columnsCount]);

  const scrollAreaHeight = useCreation(() => {
    return calcTotalHeight(allRowCount) + V_PADDING * 2;
  }, [allRowCount]);

  const { y, dataSource } = useCreation(() => {
    const index = Math.max(
      0,
      Math.floor((scrollTop - V_PADDING) / (ROW_HEIGHT + ROW_GAP))
    );
    const startIndex = columnsCount * Math.max(0, index);
    return {
      dataSource: list.slice(startIndex, startIndex + PAGE_SIZE),
      y: Math.max(0, (ROW_HEIGHT + ROW_GAP) * index),
    };
  }, [scrollTop, list, columnsCount]);

  // 滚动到底部加载更多
  useDebounceEffect(
    () => {
      if (bottom < calcTotalHeight(1)) {
        loadMore();
      }
    },
    [y, bottom],
    { wait: 16, leading: true }
  );

  return (
    <Container ref={scrollRef} scrollHidden={loading || bottom < 0}>
      <ScrollArea scrollAreaHeight={scrollAreaHeight}>
        <Grid ref={gridRef} y={y}>
          {dataSource.map((o) => (
            <Card key={o.url} name={o.name} url={o.url}></Card>
          ))}
          <StyledSpin spinning={loading}></StyledSpin>
        </Grid>
      </ScrollArea>
    </Container>
  );
}
