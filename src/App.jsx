import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { Route, Router, Routes } from 'react-router-dom'

import PortFolio from './components/PortFolio'
import { PortfolioBalance } from './components/PortfolioBalance'
import { CryptoSell } from './components/CryptoSell'
import { ExchangePriceGap } from './components/ExchangePriceGap'
import { PriceAlertTool } from './components/PriceAlertTool'


function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<PortFolio />}></Route>
        <Route path="/portfolio-balance" element={<PortfolioBalance />}></Route>
        <Route path="/cryptosell" element={<CryptoSell />}></Route>
        <Route path="/exchangepricegap" element={<ExchangePriceGap />}></Route>
        <Route path="/pricealerts" element={<PriceAlertTool />}></Route>
      </Routes>
    </>
  )
}

export default App
