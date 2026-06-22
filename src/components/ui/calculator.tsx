"use client";
import React, { useState } from "react";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [mode, setMode] = useState<"basic" | "scientific">("basic");
  const [memory, setMemory] = useState<number | null>(null);

  const handleClick = (value: string) => {
    setDisplay((prev) => (prev === "0" && value !== "." ? value : prev + value));
  };

  const handleClear = () => setDisplay("0");

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  };

  const handleCalculate = () => {
    try {
      const result = Function(`"use strict"; return (${display})`)();
      setDisplay(String(result));
    } catch {
      setDisplay("Error");
    }
  };

  const handleScientific = (fn: string) => {
    try {
      const num = parseFloat(display);
      let result = 0;
      switch (fn) {
        case "sin": result = Math.sin(num); break;
        case "cos": result = Math.cos(num); break;
        case "tan": result = Math.tan(num); break;
        case "log": result = Math.log10(num); break;
        case "ln": result = Math.log(num); break;
        case "sqrt": result = Math.sqrt(num); break;
        case "square": result = num * num; break;
        case "pi": result = Math.PI; break;
        case "e": result = Math.E; break;
        case "mc": setMemory(null); return;
        case "mr": setDisplay(memory !== null ? String(memory) : display); return;
        case "m+": setMemory((prev) => (prev ?? 0) + num); return;
        case "m-": setMemory((prev) => (prev ?? 0) - num); return;
      }
      setDisplay(String(result));
    } catch {
      setDisplay("Error");
    }
  };

  const btnClass = "px-3 py-2.5 text-sm font-medium rounded-lg transition-colors";
  const numBtn = `${btnClass} bg-gray-100 hover:bg-gray-200 text-gray-800`;
  const opBtn = `${btnClass} bg-blue-100 hover:bg-blue-200 text-blue-700`;
  const eqBtn = `${btnClass} bg-blue-600 hover:bg-blue-700 text-white`;
  const fnBtn = `${btnClass} bg-gray-200 hover:bg-gray-300 text-gray-700`;

  const basicButtons = [
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "-"],
    ["0", ".", "C", "+"],
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Calculator</h4>
        <button
          onClick={() => setMode(mode === "basic" ? "scientific" : "basic")}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {mode === "basic" ? "Scientific" : "Basic"}
        </button>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 mb-3 text-right">
        <div className="text-2xl font-mono font-bold text-gray-900 truncate">{display}</div>
      </div>
      {mode === "scientific" && (
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <button onClick={() => handleScientific("sin")} className={fnBtn}>sin</button>
          <button onClick={() => handleScientific("cos")} className={fnBtn}>cos</button>
          <button onClick={() => handleScientific("tan")} className={fnBtn}>tan</button>
          <button onClick={() => handleScientific("log")} className={fnBtn}>log</button>
          <button onClick={() => handleScientific("ln")} className={fnBtn}>ln</button>
          <button onClick={() => handleScientific("sqrt")} className={fnBtn}>√</button>
          <button onClick={() => handleScientific("square")} className={fnBtn}>x²</button>
          <button onClick={() => handleScientific("pi")} className={fnBtn}>π</button>
          <button onClick={() => handleScientific("e")} className={fnBtn}>e</button>
          <button onClick={() => handleScientific("mc")} className={fnBtn}>MC</button>
          <button onClick={() => handleScientific("mr")} className={fnBtn}>MR</button>
          <button onClick={() => handleScientific("m+")} className={fnBtn}>M+</button>
          <button onClick={() => handleScientific("m-")} className={fnBtn}>M-</button>
        </div>
      )}
      <div className="grid grid-cols-4 gap-1.5">
        {basicButtons.flat().map((btn) => (
          <button
            key={btn}
            onClick={() => {
              if (btn === "C") handleClear();
              else if (["÷", "×", "-", "+"].includes(btn)) {
                const opMap: Record<string, string> = { "÷": "/", "×": "*", "-": "-", "+": "+" };
                handleClick(opMap[btn]);
              } else if (btn === ".") handleClick(".");
              else handleClick(btn);
            }}
            className={["÷", "×", "-", "+"].includes(btn) ? opBtn : btn === "C" ? `${btnClass} bg-red-100 hover:bg-red-200 text-red-700` : numBtn}
          >
            {btn}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className={`${fnBtn} col-span-2`}
        >
          ⌫
        </button>
        <button
          onClick={handleCalculate}
          className={`${eqBtn} col-span-2`}
        >
          =
        </button>
      </div>
    </div>
  );
}
