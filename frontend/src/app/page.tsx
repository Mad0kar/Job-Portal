"use client";

import React from 'react'
import { Button } from '@/components/ui/button'
import Hero from '@/components/hero';
import CarrerGuide from '@/components/career-guide';
import ResumeAnalyzer from '@/components/resume-analyser';
import Loading from '@/components/loading';
import { useAppData } from '@/context/AppContext';
const Home = () => {
  const { loading } = useAppData();
  if (loading) return <Loading />;
  return (
    <div>
      <Hero/>
      <CarrerGuide/>
      <ResumeAnalyzer/>
    </div>
  )
}

export default Home