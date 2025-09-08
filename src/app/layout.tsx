"use client";

import Header from '@/components/app/header/_header'
import './globals.scss'
import style from "./layout.module.scss";
import Title from '@/components/app/header/title/_title'
import { Kanit, Noto_Sans, Noto_Serif, Ubuntu_Mono } from 'next/font/google';
import { Container } from '@mui/material';
import DarkModeFix from '@/components/muiWrappers/darkModeFix/_darkModeFix';
import { createContext, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';


const ns = Noto_Sans({
  subsets: ["latin"],
  variable: '--noto-sans'
});

const nss = Noto_Serif({
  subsets: ["latin"],
  variable: '--noto-serif'
});

const cn = Kanit({
  subsets: ["latin"],
  variable: "--main-body",
  weight: '400'
});

const ub = Ubuntu_Mono({
  subsets: ["latin"],
  variable: "--mono",
  weight: "400",
});

const fontClassStrings = [cn, ns, nss, ub].reduce<string>((prev, font) => `${prev} ${font.variable}`, "");

export const IOContext = createContext<Socket | undefined>(undefined);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [connected, setConnected] = useState(false);
  const [currentIO, setCurrentIO] = useState<Socket>();
  const [keys, setKeys] = useState(new Set<string>());

  useEffect(() => {
    const socket = io();

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
      setCurrentIO(socket);
    });

    return () => {
      socket.disconnect();
      setConnected(false);
      setCurrentIO(undefined);
    };
  }, []);

  return (
    <IOContext.Provider value={currentIO}>
      <html lang="en">
        <body className={`${style.body} ${fontClassStrings}`}>
          <header>
            <Header>
              <Title text="PairNote" />
            </Header>
          </header>
          <DarkModeFix>
            <Container maxWidth="xl" sx={{ fontFamily: "Kanit" }}>
              {children}
            </Container>
          </DarkModeFix>
        </body>
      </html>
    </IOContext.Provider>
  )
}

