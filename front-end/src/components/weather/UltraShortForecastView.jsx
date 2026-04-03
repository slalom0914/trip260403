import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Table,
  Alert,
  Typography,
  Row,
  Col,
  Space,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { fetchUltraShortForecast } from '../../service/weatherApi';

const { Title, Text } = Typography;

/**
 * 초단기예보조회 페이지
 * - 발표일자, 발표시각, nx, ny 입력
 * - Spring Boot 백엔드 API 호출
 * - 결과를 antd Table로 출력
 */
const UltraShortForecastView = () => {
  // 발표일자 상태
  const [baseDate, setBaseDate] = useState('20260402');

  // 발표시각 상태
  const [baseTime, setBaseTime] = useState('0630');

  // 예보지점 X 좌표 상태
  const [nx, setNx] = useState(55);

  // 예보지점 Y 좌표 상태
  const [ny, setNy] = useState(127);

  // 조회 결과 목록 상태
  const [items, setItems] = useState([]);

  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // 오류 메시지 상태
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * 조회 실행 함수
   */
  const handleSearch = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // 백엔드 API 호출
      const response = await fetchUltraShortForecast({
        baseDate,
        baseTime,
        nx,
        ny,
        pageNo: 1,
        numOfRows: 100,
      });

      // 조회 결과 반영
      setItems(Array.isArray(response?.items) ? response.items : []);
    } catch (error) {
      console.error('초단기예보 조회 실패:', error);
      setErrorMessage('초단기예보 조회 중 오류가 발생했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 입력값 초기화 함수
   */
  const handleReset = () => {
    setBaseDate('20260402');
    setBaseTime('0630');
    setNx(55);
    setNy(127);
    setItems([]);
    setErrorMessage('');
  };

  /**
   * antd Table 컬럼 정의
   */
  const columns = [
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      align: 'center',
    },
    {
      title: '예보일자',
      dataIndex: 'fcstDate',
      key: 'fcstDate',
      width: 140,
      align: 'center',
    },
    {
      title: '예보시각',
      dataIndex: 'fcstTime',
      key: 'fcstTime',
      width: 120,
      align: 'center',
    },
    {
      title: '예보값',
      dataIndex: 'fcstValue',
      key: 'fcstValue',
      width: 120,
      align: 'center',
    },
    {
      title: '기준일자',
      dataIndex: 'baseDate',
      key: 'baseDate',
      width: 140,
      align: 'center',
    },
    {
      title: '기준시각',
      dataIndex: 'baseTime',
      key: 'baseTime',
      width: 120,
      align: 'center',
    },
    {
      title: 'NX',
      dataIndex: 'nx',
      key: 'nx',
      width: 100,
      align: 'center',
    },
    {
      title: 'NY',
      dataIndex: 'ny',
      key: 'ny',
      width: 100,
      align: 'center',
    },
  ];

  /**
   * Table에 표시할 데이터 가공
   * - key 값을 추가해서 React 렌더링 안정성 확보
   */
  const dataSource = items.map((item, index) => ({
    key: `${item.category}-${item.fcstDate}-${item.fcstTime}-${index}`,
    ...item,
  }));

  return (
    <div style={{ padding: '24px' }}>
      <Card
        variant="borderless"
        style={{
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <Space orientation="vertical" size={20} style={{ width: '100%' }}>
          {/* 페이지 제목 */}
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              초단기예보조회
            </Title>
            <Text type="secondary">
              발표일자, 발표시각, 예보지점 X/Y 좌표를 입력해서 초단기예보 정보를 조회합니다.
            </Text>
          </div>

          {/* 검색 조건 영역 */}
          <Card
            size="small"
            title="조회 조건"
            style={{ borderRadius: '12px' }}
          >
            <Form layout="vertical">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="발표일자">
                    <Input
                      value={baseDate}
                      onChange={(e) => setBaseDate(e.target.value)}
                      placeholder="예: 20260402"
                      maxLength={8}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="발표시각">
                    <Input
                      value={baseTime}
                      onChange={(e) => setBaseTime(e.target.value)}
                      placeholder="예: 0630"
                      maxLength={4}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="예보지점 X 좌표 (NX)">
                    <InputNumber
                      value={nx}
                      onChange={(value) => setNx(value ?? 0)}
                      placeholder="NX"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="예보지점 Y 좌표 (NY)">
                    <InputNumber
                      value={ny}
                      onChange={(value) => setNy(value ?? 0)}
                      placeholder="NY"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={loading}
                  onClick={handleSearch}
                >
                  조회
                </Button>

                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  disabled={loading}
                >
                  초기화
                </Button>
              </Space>
            </Form>
          </Card>

          {/* 오류 메시지 */}
          {errorMessage && (
            <Alert
              title={errorMessage}
              type="error"
              showIcon
            />
          )}

          {/* 결과 테이블 */}
          <Card
            size="small"
            title={`조회 결과 (${dataSource.length}건)`}
            style={{ borderRadius: '12px' }}
          >
            <Table
              columns={columns}
              dataSource={dataSource}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              locale={{
                emptyText: loading ? '조회 중입니다...' : '조회 결과가 없습니다.',
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default UltraShortForecastView;