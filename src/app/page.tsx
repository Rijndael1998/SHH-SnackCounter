"use client";

import { useContext, useEffect, useRef, useState } from 'react';
import { IOContext } from './layout';
import { Grid2, Paper, Stack, SxProps, Theme, Typography } from '@mui/material';

type CameraMessage = {
    frame: number;
    fps: number;
    ex: number;
    ag: number;
    dg: number;
}

function ParseCameraMessage(values: any): CameraMessage {
    return {
        frame: Number.parseInt(values["frame"]),
        fps: Number.parseFloat(values["fps"]),
        ex: Number.parseFloat(values["ex"]),
        ag: Number.parseFloat(values["ag"]),
        dg: Number.parseFloat(values["dg"]),
    }
}

export default function Home() {
    const io = useContext(IOContext);

    useEffect(() => {
        if (!io)
            return;

        const telemetry = (e: ArrayBuffer) => {
            try {
                const msg = JSON.parse(Buffer.from(e).toString());
                console.log(msg);

                switch (msg["k"]) {

                }

            } catch {
                return;
            }
        }

        io.on("telem", telemetry);

        return () => {
            io.off("telem", telemetry);
        }

    }, [io]);

    const isConnected = io !== undefined;
    const paperOffsets = ".4em";
    const paperSx: SxProps<Theme> = {
        padding: paperOffsets,
        margin: paperOffsets
    };
    const paperElev = 5;
    const paperSizing = {
        xs: 2,
        md: 1
    };

    return <></>;
}