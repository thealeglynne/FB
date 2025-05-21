'use client';
import LiderPanel from './/leader-panel/page'
import { useState, useEffect } from "react";

export default function Home() {
 
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-start justify-items-center min-h-screen p-8 gap-12 sm:p-20 font-sans">
     <LiderPanel /> 
    </div>
  );
}
