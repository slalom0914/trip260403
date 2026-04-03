import React from 'react'
import HeaderTrip from '../include/HeaderTrip'
import UltraShortForecastView from '../weather/UltraShortForecastView'
const WeatherPage = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <HeaderTrip />
      <div className="container py-4">
        <h1>날씨</h1>
        <p className="text-muted mb-0">날씨 정보를 이곳에서 확인할 수 있습니다.</p>
        <UltraShortForecastView />
      </div>
    </div>
  )
}

export default WeatherPage