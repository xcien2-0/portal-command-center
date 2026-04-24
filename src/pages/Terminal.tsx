import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";

interface OutputLine {
  id: number;
  type: "input" | "output" | "error" | "info" | "success";
  text: string;
}

const BANNER = [
  " _     _____   _____   _____ _    _ ____  ",
  "| |   |_   _| / ____| |  ___| |  | |  _ \\ ",
  "| |     | |  | (___   | |_  | |__| | |_) |",
  "| |     | |   \\___ \\  |  _| |  __  |  _ < ",
  "| |___ _| |_  ____) | | |   | |  | | |_) |",
  "|_____|_____||_____/  |_|   |_|  |_|____/ ",
  "",
  "  Live Status Hub — Terminal v1.0.0",
  "  Escribe 'help' para ver los comandos disponibles.",
  "",
];

function getTimestamp() {
  return new Date().toLocaleTimeString("es-MX", { hour12: false });
}

function buildOutput(text: string, type: OutputLine["type"] = "output"): OutputLine {
  return { id: Date.now() + Math.random(), type, text };
}

const COMMANDS: Record<string, (args: string[]) => OutputLine[]> = {
  help: () =>
    [
      "Comandos disponibles:",
      "  help              Muestra esta ayuda",
      "  clear / cls       Limpia la terminal",
      "  status            Estado general del sistema",
      "  ping <host>       Simula un ping al host",
      "  traceroute <host> Simula traceroute",
      "  nslookup <host>   Consulta DNS simulada",
      "  uptime            Tiempo activo del sistema",
      "  whoami            Usuario actual",
      "  date              Fecha y hora actual",
      "  echo <texto>      Repite el texto",
      "  history           Historial de comandos",
      "  version           Versión del sistema",
      "  ifconfig          Interfaces de red simuladas",
      "  netstat           Conexiones activas simuladas",
    ].map((t) => buildOutput(t, "info")),

  clear: () => [],

  cls: () => [],

  status: () =>
    [
      `[${getTimestamp()}] Verificando servicios...`,
      "  ● NOC             ACTIVO     latencia: 12ms",
      "  ● Dispatch        ACTIVO     latencia: 8ms",
      "  ● Call Center     ACTIVO     latencia: 15ms",
      "  ● Supabase DB     ACTIVO     latencia: 24ms",
      "  ● Red en Vivo     ACTIVO     latencia: 6ms",
      "",
      "  Todos los servicios operando con normalidad.",
    ].map((t, i) =>
      buildOutput(t, i === 0 ? "info" : t.includes("normalidad") ? "success" : "output")
    ),

  uptime: () => {
    const hours = Math.floor(Math.random() * 720 + 24);
    const mins = Math.floor(Math.random() * 60);
    return [buildOutput(`Sistema activo por ${hours}h ${mins}m. Carga: 0.32 0.28 0.21`, "output")];
  },

  whoami: () => [buildOutput("operador@live-status-hub", "output")],

  date: () => [
    buildOutput(
      new Date().toLocaleString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      "output"
    ),
  ],

  version: () =>
    [
      "Live Status Hub  v1.0.0",
      "React            v18.3.1",
      "Vite             v5.4.19",
      "TypeScript       v5.8.3",
      "Supabase SDK     latest",
    ].map((t) => buildOutput(t, "output")),

  ifconfig: () =>
    [
      "eth0    Link encap:Ethernet  HWaddr 00:1a:2b:3c:4d:5e",
      "        inet addr:10.0.0.42  Bcast:10.0.0.255  Mask:255.255.255.0",
      "        RX packets:1482340  TX packets:923812",
      "",
      "lo      Link encap:Local Loopback",
      "        inet addr:127.0.0.1  Mask:255.0.0.0",
    ].map((t) => buildOutput(t, "output")),

  netstat: () =>
    [
      "Conexiones activas (TCP):",
      "  Proto  Local               Remoto              Estado",
      "  tcp    10.0.0.42:443       52.84.12.9:8973     ESTABLISHED",
      "  tcp    10.0.0.42:443       35.190.40.1:51204   ESTABLISHED",
      "  tcp    10.0.0.42:5432      10.0.0.1:3412       ESTABLISHED",
      "  tcp    10.0.0.42:80        0.0.0.0:*           LISTEN",
    ].map((t) => buildOutput(t, "output")),

  echo: (args) => [buildOutput(args.join(" ") || "", "output")],

  ping: (args) => {
    const host = args[0] || "8.8.8.8";
    return [
      buildOutput(`PING ${host}: 56 bytes de datos`, "info"),
      buildOutput(`64 bytes de ${host}: icmp_seq=0 ttl=55 time=${(Math.random() * 20 + 5).toFixed(2)} ms`, "output"),
      buildOutput(`64 bytes de ${host}: icmp_seq=1 ttl=55 time=${(Math.random() * 20 + 5).toFixed(2)} ms`, "output"),
      buildOutput(`64 bytes de ${host}: icmp_seq=2 ttl=55 time=${(Math.random() * 20 + 5).toFixed(2)} ms`, "output"),
      buildOutput(`64 bytes de ${host}: icmp_seq=3 ttl=55 time=${(Math.random() * 20 + 5).toFixed(2)} ms`, "output"),
      buildOutput(`--- ${host} estadísticas ---`, "info"),
      buildOutput(`4 paquetes transmitidos, 4 recibidos, 0% pérdida`, "success"),
    ];
  },

  traceroute: (args) => {
    const host = args[0] || "8.8.8.8";
    const hops = [
      "10.0.0.1",
      "192.168.1.1",
      "201.116.5.14",
      "201.116.5.1",
      "72.14.215.85",
      host,
    ];
    return [
      buildOutput(`traceroute a ${host}:`, "info"),
      ...hops.map((ip, i) =>
        buildOutput(
          ` ${String(i + 1).padStart(2)}  ${ip.padEnd(18)} ${(Math.random() * 30 + 2).toFixed(2)} ms`,
          "output"
        )
      ),
    ];
  },

  nslookup: (args) => {
    const host = args[0] || "xcien.com";
    return [
      buildOutput(`Servidor: 8.8.8.8`, "info"),
      buildOutput(`Nombre: ${host}`, "output"),
      buildOutput(`Dirección: ${Math.floor(Math.random()*200+50)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`, "output"),
    ];
  },
};

export default function Terminal() {
  const [lines, setLines] = useState<OutputLine[]>(() =>
    BANNER.map((t) => buildOutput(t, "info"))
  );
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const runCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const newHistory = [trimmed, ...cmdHistory].slice(0, 100);
      setCmdHistory(newHistory);
      setHistoryIdx(-1);

      const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);
      const prompt = buildOutput(`$ ${trimmed}`, "input");

      if (cmd === "clear" || cmd === "cls") {
        setLines([prompt, buildOutput("", "output")]);
        return;
      }

      if (cmd === "history") {
        const histLines = newHistory.map((h, i) =>
          buildOutput(`  ${String(i + 1).padStart(3)}  ${h}`, "output")
        );
        setLines((prev) => [...prev, prompt, ...histLines]);
        return;
      }

      const handler = COMMANDS[cmd];
      if (handler) {
        setLines((prev) => [...prev, prompt, ...handler(args)]);
      } else {
        setLines((prev) => [
          ...prev,
          prompt,
          buildOutput(`bash: ${cmd}: comando no encontrado. Escribe 'help'.`, "error"),
        ]);
      }
    },
    [cmdHistory]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(idx);
      setInput(cmdHistory[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? "" : cmdHistory[idx]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const partial = input.trim();
      const match = Object.keys(COMMANDS).find((c) => c.startsWith(partial));
      if (match) setInput(match);
    }
  };

  const colorClass: Record<OutputLine["type"], string> = {
    input: "text-cyan-400 font-semibold",
    output: "text-green-300",
    error: "text-red-400",
    info: "text-yellow-300",
    success: "text-emerald-400",
  };

  return (
    <div
      className="fixed inset-0 bg-gray-950 flex flex-col font-mono text-sm overflow-hidden"
      style={{ WebkitTapHighlightColor: "transparent" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-gray-400 text-xs tracking-widest uppercase">
          terminal — live-status-hub
        </span>
        <span className="text-gray-600 text-xs">{getTimestamp()}</span>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 overscroll-contain">
        {lines.map((line) => (
          <div key={line.id} className={`whitespace-pre-wrap break-all leading-5 ${colorClass[line.type]}`}>
            {line.text || " "}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex-none flex items-center gap-2 px-3 py-3 bg-gray-900 border-t border-gray-700">
        <span className="text-cyan-400 select-none flex-none">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="send"
          className="flex-1 bg-transparent text-green-300 caret-green-400 outline-none placeholder:text-gray-600 min-w-0"
          placeholder="escribe un comando..."
        />
      </div>
    </div>
  );
}
