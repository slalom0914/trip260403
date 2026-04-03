import React, { useEffect, useState } from 'react'
import HeaderTrip from '../include/HeaderTrip'
import FooterTrip from '../include/FooterTrip'
import styles from './reboard.module.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { boardListDB } from '../../service/boardLogic'
import ReBoardItem from './ReBoardItem'

const PAGE_SIZE = 3
const PAGE_WINDOW = 5

const ReBoardList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [boards, setBoards] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)

  const applyListResponse = (data) => {
    if (!data) return
    setBoards(Array.isArray(data.list) ? data.list : [])
    setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : 0)
    if (typeof data.page === 'number' && data.page >= 1) {
      setPage(data.page)
    }
  }

  /**
   * 목록 URL(?page=&gubun=&keyword=)을 단일 기준으로 두고, 변경 시마다 API 조회.
   * 상세에서 돌아올 때도 같은 쿼리스트링이면 마지막 페이지가 유지된다.
   */
  useEffect(() => {
    const rawPage = searchParams.get('page')
    const parsed = parseInt(rawPage || '1', 10)
    const pageNum = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
    const gubun = searchParams.get('gubun') || null
    const keyword = searchParams.get('keyword') || null

    const gubunEl = document.querySelector('#gubun')
    const keywordEl = document.querySelector('#keyword')
    if (gubunEl) gubunEl.value = gubun || ''
    if (keywordEl) keywordEl.value = keyword || ''

    let cancelled = false
    ;(async () => {
      try {
        const res = await boardListDB({
          gubun,
          keyword,
          page: pageNum,
          pageSize: PAGE_SIZE,
        })
        if (cancelled) return
        console.log(res.data)
        applyListResponse(res.data)
      } catch (e) {
        console.error(e)
        const msg = e.response?.status === 500
          ? '서버 오류(500): 백엔드 로그의 SQL·DB 연결을 확인하세요.'
          : (e.message || '목록 요청 실패')
        alert(msg)
      }
    })()
    return () => { cancelled = true }
  }, [searchParams])

  const boardSearch = () => {
    const gubunEl = document.querySelector('#gubun')
    const keywordEl = document.querySelector('#keyword')
    const gubun = gubunEl?.value ? gubunEl.value : null
    const keyword = keywordEl?.value?.trim() ? keywordEl.value.trim() : null
    console.log(`${gubun}, ${keyword}`)
    const next = new URLSearchParams()
    next.set('page', '1')
    if (gubun) next.set('gubun', gubun)
    if (keyword) next.set('keyword', keyword)
    setSearchParams(next)
  }

  const boardList = () => {
    console.log('전체조회')
    const gubunEl = document.querySelector('#gubun')
    const keywordEl = document.querySelector('#keyword')
    if (gubunEl) gubunEl.value = ''
    if (keywordEl) keywordEl.value = ''
    const next = new URLSearchParams()
    next.set('page', '1')
    setSearchParams(next)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const getPageNumbers = () => {
    let start = Math.max(1, page - Math.floor(PAGE_WINDOW / 2))
    let end = Math.min(totalPages, start + PAGE_WINDOW - 1)
    start = Math.max(1, end - PAGE_WINDOW + 1)
    const nums = []
    for (let i = start; i <= end; i++) nums.push(i)
    return nums
  }

  const goPage = (p) => {
    const current = parseInt(searchParams.get('page') || '1', 10)
    if (p < 1 || p > totalPages || p === current) return
    const next = new URLSearchParams(searchParams)
    next.set('page', String(p))
    setSearchParams(next)
  }

  const listSearchString = searchParams.toString()

  return (
    <>
      <HeaderTrip />
      <div className="container">
        <div className={styles.pageHeader}>
          <h2>댓글게시판<small> - Quill Editor</small></h2>
          <hr />
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            boardSearch()
          }}
        >
          <div className="col-sm-3">
            <select className="form-select" id="gubun">
              <option value="">분류선택</option>
              <option value="b_title">제목</option>
              <option value="b_writer">작성자</option>
              <option value="b_content">내용</option>
            </select>
          </div>
          <div className="col-sm-6">
            <input
              type="text"
              className="form-control"
              placeholder="검색어를 입력하세요"
              id="keyword"
              autoComplete="off"
            />
          </div>
          <div className="col-sm-3">
            <button type="submit" className="btn btn-danger">검색</button>
          </div>
        </form>
        <div className="row mt-2">
          <div className="col-sm-12 text-muted small">
            총 {totalCount}건 · {PAGE_SIZE}건씩
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12">
            <table className={`table table-hover ${styles.listBody}`}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(boards) && boards.map((board) => (
                  <ReBoardItem key={board.b_no} {...board} listSearch={listSearchString} />
                ))}
              </tbody>
            </table>

            <nav aria-label="게시판 페이지" className="mt-3">
              <ul className="pagination justify-content-center flex-wrap">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => goPage(1)}
                    disabled={page <= 1}
                  >
                    처음
                  </button>
                </li>
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => goPage(page - 1)}
                    disabled={page <= 1}
                  >
                    이전
                  </button>
                </li>
                {getPageNumbers().map((num) => (
                  <li
                    key={num}
                    className={`page-item ${num === page ? 'active' : ''}`}
                    aria-current={num === page ? 'page' : undefined}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => goPage(num)}
                    >
                      {num}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => goPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    다음
                  </button>
                </li>
                <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => goPage(totalPages)}
                    disabled={page >= totalPages}
                  >
                    마지막
                  </button>
                </li>
              </ul>
            </nav>

            <div className={styles.listFooter}>
              <button type="button" className="btn btn-warning" onClick={boardList}>전체조회</button>
              &nbsp;
              <button type="button" className="btn btn-success" onClick={() => navigate('/reboard/write')}>글쓰기</button>
            </div>
          </div>
        </div>
      </div>
      <FooterTrip />
    </>
  )
}

export default ReBoardList
