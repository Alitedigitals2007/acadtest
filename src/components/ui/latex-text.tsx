"use client";
import React, { useEffect, useRef } from "react";
import katex from "katex";

interface LatexTextProps {
  text: string;
  className?: string;
}

function renderLatexInElement(el: HTMLElement, text: string) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g);
  el.innerHTML = "";
  parts.forEach((part) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2).trim();
      const span = document.createElement("span");
      try {
        katex.render(math, span, { displayMode: true, throwOnError: false });
      } catch {
        span.textContent = math;
      }
      el.appendChild(span);
    } else if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const math = part.slice(1, -1).trim();
      const span = document.createElement("span");
      try {
        katex.render(math, span, { displayMode: false, throwOnError: false });
      } catch {
        span.textContent = math;
      }
      el.appendChild(span);
    } else {
      const textNode = document.createTextNode(part);
      el.appendChild(textNode);
    }
  });
}

export default function LatexText({ text, className = "" }: LatexTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      renderLatexInElement(ref.current, text);
    }
  }, [text]);

  return <span ref={ref} className={className} />;
}
