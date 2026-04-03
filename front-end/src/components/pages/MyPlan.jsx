import React from 'react'
import HeaderTrip from '../include/HeaderTrip'
const MyPlan = () => {
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
      <h1>내 여행</h1>
      <p className="text-muted mb-0">여행 계획을 이곳에서 관리할 수 있습니다.</p>
      </div>
    </div>
  )
}

export default MyPlan
