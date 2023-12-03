import React from 'react';
import styled from '@emotion/styled';
import { useRequest, useSafeState } from 'ahooks';
import axios from 'axios';
import { Spin } from 'antd';
import { useCreation } from 'ahooks';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useInViewport } from 'ahooks';
import { useMemoizedFn } from 'ahooks';
import { useDebounceEffect } from 'ahooks';

const Container = styled.div`
  transition: all 0.1s ease-in-out;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 40px #0000001a;
  }
`;

const Name = styled.span`
  font-size: 20px;
  font-weight: 700;
`;

const StyledSpin = styled(Spin)`
  position: absolute;
  top: 50%;
  transform: translate3d(-50%, -50%, 0);
  left: 50%;
`;

const ImgContiner = styled.div`
  width: 100px;
  height: 100px;
  cursor: pointer;
  position: relative;
  &:hover {
    mask-position: 0 0;
    transform: perspective(50px) rotate3d(1, -1, 0, 4deg);
    img:nth-of-type(1) {
      z-index: -1;
      opacity: 0;
      transform: rotateY(180deg);
    }
    img:nth-of-type(2) {
      z-index: 1;
      opacity: 1;
      transform: rotateY(360deg);
    }
  }
  img:nth-of-type(1) {
    z-index: 1;
    opacity: 1;
  }
  img:nth-of-type(2) {
    z-index: -1;
    opacity: 0;
    transform: rotateY(180deg);
  }
`;

const Img = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  aspect-ratio: 1;
  transition: all 0.2s ease-in-out;
`;

interface CardProps {
  url: string;
  name: string;
}

interface PokemonDetail {
  id?: string;
  backSrc: string;
  name: string;
  frontSrc: string;
}

const enum Status {
  Success,
  Error,
  Loading,
}

function ImageBox(props: Pick<PokemonDetail, 'backSrc' | 'frontSrc'>) {
  const { backSrc, frontSrc } = props;
  const [status, setStatus] = useSafeState(Status.Loading);
  const ref = useRef<HTMLDivElement>(null);

  const [inViewport] = useInViewport(ref);

  const loadImage = useMemoizedFn(() => {
    // 出现在屏幕中都会尝试加载
    if (!inViewport || status === Status.Success) return;
    setStatus(Status.Loading);
    // 能缓存下来就是成功
    const images = [backSrc, frontSrc].map((src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });
    });
    Promise.all(images)
      .then(() => {
        setStatus(Status.Success);
      })
      .catch(() => setStatus(Status.Error));
  });

  useDebounceEffect(loadImage, [backSrc, frontSrc, inViewport], {
    wait: 16,
  });

  const content = useCreation(() => {
    switch (status) {
      case Status.Loading:
        return <StyledSpin spinning></StyledSpin>;
      case Status.Error:
      // // TODO: 给个错误占位图
      // return <img></img>;
      case Status.Success:
        return (
          <>
            <Img alt="not found" src={backSrc}></Img>
            <Img alt="not found" src={frontSrc}></Img>
          </>
        );
    }
  }, [status]);

  return <ImgContiner ref={ref}>{content}</ImgContiner>;
}

function usePokenManDetail(url: string) {
  const [data, setData] = useSafeState<PokemonDetail>({} as PokemonDetail);
  const { loading } = useRequest(() => axios.get(url), {
    onSuccess: (res) => {
      const { sprites, name } = res?.data;
      const { back_default, front_default } = sprites ?? {};
      setData({
        backSrc: back_default,
        frontSrc: front_default,
        name,
      });
    },
    onError: (err) => {
      // TODO: log
    },
    debounceWait: 16,
  });
  return { data, loading };
}

// TODO: 抽屉详情
const Card: React.FC<CardProps> = (props) => {
  const { url, name } = props;
  const { data } = usePokenManDetail(url);
  return (
    <Container>
      <ImageBox backSrc={data?.backSrc} frontSrc={data?.frontSrc}></ImageBox>
      <Name>{name}</Name>
    </Container>
  );
};

export default Card;
