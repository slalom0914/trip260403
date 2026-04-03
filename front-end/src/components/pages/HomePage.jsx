import React, { useCallback, useState } from 'react'
import { App, Modal, Typography, Select, DatePicker, Button } from 'antd'
import dayjs from 'dayjs'
import HeaderTrip from '../include/HeaderTrip'
import KoreaSidoMapInteractive from './KoreaSidoMapInteractive'
import styles from './homePage.module.css'

const { RangePicker } = DatePicker

/** SVG 시도 id와 동일한 17개 광역시·도 */
const SIDO_OPTIONS = [
  { value: '서울특별시', label: '서울특별시' },
  { value: '부산광역시', label: '부산광역시' },
  { value: '대구광역시', label: '대구광역시' },
  { value: '인천광역시', label: '인천광역시' },
  { value: '광주광역시', label: '광주광역시' },
  { value: '대전광역시', label: '대전광역시' },
  { value: '울산광역시', label: '울산광역시' },
  { value: '세종특별자치시', label: '세종특별자치시' },
  { value: '경기도', label: '경기도' },
  { value: '강원특별자치도', label: '강원특별자치도' },
  { value: '충청북도', label: '충청북도' },
  { value: '충청남도', label: '충청남도' },
  { value: '전북특별자치도', label: '전북특별자치도' },
  { value: '전라남도', label: '전라남도' },
  { value: '경상북도', label: '경상북도' },
  { value: '경상남도', label: '경상남도' },
  { value: '제주특별자치도', label: '제주특별자치도' },
]

const HomePage = () => {
  const { message } = App.useApp()
  const [destination, setDestination] = useState()
  const [tripRange, setTripRange] = useState(() => [
    dayjs(),
    dayjs().add(3, 'day'),
  ])

  const handleSidoClick = useCallback(
    ({ id, name }) => {
      const label = name || id
      setDestination(label)
      message.info(`선택: ${label}`)
    },
    [message],
  )

  const handleStartPlan = () => {
    if (!destination) {
      message.warning('여행지(시·도)를 선택해 주세요.')
      return
    }
    if (!tripRange?.[0] || !tripRange?.[1]) {
      message.warning('여행 기간을 선택해 주세요.')
      return
    }
    message.success(
      `${destination} · ${tripRange[0].format('YYYY-MM-DD')} ~ ${tripRange[1].format('YYYY-MM-DD')}`,
    )
  }

  return (
    <div className={styles.homeRoot}>
      <HeaderTrip />
      <section className={styles.hero}>
        <Modal
          open
          title={null}
          footer={null}
          closable={false}
          mask={false}
          centered={false}
          width={300}
          wrapClassName="home-plan-modal-wrap"
          style={{
            position: 'fixed',
            top: 220,
            left: 224,
            margin: 0,
            paddingBottom: 0,
          }}
          styles={{
            body: { padding: '20px 0px 22px' },
          }}
        >
          <div className={styles.planModalContent}>
            <Typography.Title level={5} className={styles.planModalHeading}>
              어떤 여행을 계획하고 있나요?
            </Typography.Title>
            <Typography.Paragraph className={styles.planModalSub}>
              어디로 가볼까요?
            </Typography.Paragraph>
            <Select
              showSearch
              allowClear
              placeholder="시·도 선택"
              options={SIDO_OPTIONS}
              value={destination}
              onChange={setDestination}
              optionFilterProp="label"
              style={{ width: '100%', textAlign: 'left' }}
            />
            <Typography.Paragraph
              className={styles.planModalSub}
              style={{ marginTop: 4 }}
            >
              언제 출발할까요?
            </Typography.Paragraph>
            <RangePicker
              value={tripRange}
              onChange={(v) => setTripRange(v)}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={(current) =>
                !!current && current.isBefore(dayjs(), 'day')
              }
            />
            <Button
              type="primary"
              block
              size="large"
              className={styles.planStartBtn}
              onClick={handleStartPlan}
            >
              여행 계획 시작하기
            </Button>
          </div>
        </Modal>

        <div className={styles.mapColumn}>
          <KoreaSidoMapInteractive
            className={styles.sidoMapOffset}
            onSidoClick={handleSidoClick}
          />
        </div>
      </section>
    </div>
  )
}

export default HomePage
