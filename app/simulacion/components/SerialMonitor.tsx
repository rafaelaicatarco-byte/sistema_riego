'use client';

import { useEffect, useRef } from 'react';

export interface LogEntry {
  time: string;
  msg: string;
  cls?: 'evt' | 'warn';
}

interface SerialMonitorProps {
  logs: LogEntry[];
}

export default function SerialMonitor({ logs }: SerialMonitorProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#1B2420] border border-[#2C3B33] rounded-xl p-[18px]">
      <div className="flex justify-between items-center mb-2.5">
        <h2 className="font-['Space_Grotesk'] text-[13px] uppercase tracking-[.08em] m-0 text-[#8FA398] flex items-center gap-2 before:content-[''] before:w-[5px] before:h-[5px] before:bg-[#3FA7D6] before:rotate-45">
          Monitor serie
        </h2>
        <span className="font-['JetBrains_Mono'] text-[11px] text-[#8FA398]">115200 baud</span>
      </div>
      <div
        ref={terminalRef}
        className="bg-[#0A0E0B] border border-[#2C3B33] rounded-[10px] h-[230px] overflow-y-auto p-3 font-['JetBrains_Mono'] text-[12.3px] leading-relaxed text-[#4AF77D]"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#2C3B33 transparent' }}
      >
        {logs.length === 0 ? (
          <div className="text-[#5C7A68] italic">[Sistema inactivo — esperando inicio]</div>
        ) : (
          logs.map((entry, i) => (
            <div
              key={i}
              className="whitespace-pre-wrap"
              style={{ color: entry.cls === 'evt' ? '#F2C879' : entry.cls === 'warn' ? '#E2574C' : '#4AF77D' }}
            >
              [{entry.time}] {entry.msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
