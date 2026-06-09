"use client";

import React from 'react'
import { Button } from '@/components/ui/button'
import Hero from '@/components/hero';
import CarrerGuide from '@/components/career-guide';
import ResumeAnalyzer from '@/components/resume-analyser';
const Home = () => {
  return (
    <div>
      <Hero/>
      <CarrerGuide/>
      <ResumeAnalyzer/>
    </div>
  )
}

export default Home