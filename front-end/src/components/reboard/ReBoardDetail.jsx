import React, { useCallback, useEffect, useState } from 'react'
import HeaderTrip from '../include/HeaderTrip'
import FooterTrip from '../include/FooterTrip'
import styles from './reboard.module.css'
import { BButton, FormDiv } from '../../styles/FormStyles'
import ReBoardHeader from './ReBoardHeader'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  boardDetailDB,
  reCommentInsertDB,
  reCommentDeleteDB,
  reCommentUpdateDB,
} from '../../service/boardLogic'

const ReBoardDetail = () => {
  const { b_no } = useParams()
  const [searchParams] = useSearchParams()
  const pageRaw = parseInt(searchParams.get('page') || '1', 10)
  const listPage = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw

  // 신규 댓글 작성자
  const [bcWriter, setBcWriter] = useState('')

  // 신규 댓글 내용
  const [newComment, setNewComment] = useState('')

  // 게시글 상세
  const [board, setBoard] = useState({
    b_no: 0,
    b_title: '',
    b_writer: '',
    b_content: '',
    b_date: '',
    b_hit: 0,
  })

  // 댓글 목록
  const [comments, setComments] = useState([])

  // 현재 수정 중인 댓글 번호
  const [editingCommentNo, setEditingCommentNo] = useState(null)

  // 수정 중인 댓글 내용
  const [editingCommentText, setEditingCommentText] = useState('')

  /**
   * 게시글 상세 + 댓글 목록 조회
   */
  const loadBoardDetail = useCallback(async () => {
    try {
      const res = await boardDetailDB(b_no)
      const data = res?.data ?? []

      setBoard(
        data[0] ?? {
          b_no: 0,
          b_title: '',
          b_writer: '',
          b_content: '',
          b_date: '',
          b_hit: 0,
        },
      )

      if (data[1]?.comments && Array.isArray(data[1].comments)) {
        setComments(data[1].comments)
      } else {
        setComments([])
      }
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error)
      alert('게시글 정보를 불러오는 중 오류가 발생했습니다.')
      setComments([])
    }
  }, [b_no])

  useEffect(() => {
    if (!b_no) return
    loadBoardDetail()
  }, [b_no, loadBoardDetail])

  /**
   * 신규 댓글 등록
   */
  const commentInsert = async () => {
    if (!bcWriter.trim()) {
      alert('작성자를 입력하세요.')
      return
    }

    if (!newComment.trim()) {
      alert('댓글을 작성하세요.')
      return
    }

    const cmt = {
      b_no: Number(b_no),
      bc_comment: newComment.trim(),
      bc_writer: bcWriter.trim(),
    }

    try {
      const res = await reCommentInsertDB(cmt)

      // 백엔드가 "1" 또는 1 반환하는 경우 모두 대응
      if (String(res?.data) === '1') {
        // 등록 성공 후 입력값 초기화
        setBcWriter('')
        setNewComment('')
        await loadBoardDetail()
      } else {
        alert('댓글이 등록되지 않았습니다.')
      }
    } catch (error) {
      console.error('댓글 등록 실패:', error)
      alert('댓글 등록 중 오류가 발생했습니다.')
    }
  }

  /**
   * 댓글 수정 모드 시작
   */
  const startEditComment = (commentItem) => {
    setEditingCommentNo(commentItem.bc_no)
    setEditingCommentText(commentItem.bc_comment ?? '')
  }

  /**
   * 댓글 수정 취소
   */
  const cancelEditComment = () => {
    setEditingCommentNo(null)
    setEditingCommentText('')
  }

  /**
   * 댓글 수정 저장
   */
  const commentUpdate = async (bc_no) => {
    if (!editingCommentText.trim()) {
      alert('수정할 댓글 내용을 입력하세요.')
      return
    }

    const cmt = {
      b_no: Number(b_no),
      bc_no: Number(bc_no),
      bc_comment: editingCommentText.trim(),
    }

    try {
      const res = await reCommentUpdateDB(cmt)

      if (String(res?.data) === '1') {
        alert('댓글이 수정되었습니다.')
        cancelEditComment()
        await loadBoardDetail()
      } else {
        alert('댓글이 수정되지 않았습니다.')
      }
    } catch (error) {
      console.error('댓글 수정 실패:', error)
      alert('댓글 수정 중 오류가 발생했습니다.')
    }
  }

  /**
   * 댓글 삭제
   */
  const commentDelete = async (bc_no) => {
    const isConfirmed = window.confirm('댓글을 삭제하시겠습니까?')
    if (!isConfirmed) return

    try {
      const res = await reCommentDeleteDB(bc_no)

      if (String(res?.data) === '1') {
        alert('댓글이 삭제되었습니다.')

        // 삭제한 댓글이 수정 중이던 댓글이면 수정 상태 초기화
        if (editingCommentNo === bc_no) {
          cancelEditComment()
        }

        await loadBoardDetail()
      } else {
        alert('댓글이 삭제되지 않았습니다.')
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <>
      <HeaderTrip />

      <div className="container">
        <div className={styles.pageHeader}>
          <h2>
            상세보기<small> - Quill Editor</small>
          </h2>
          <hr />
        </div>

        <FormDiv>
          {/* 댓글 개수를 헤더 컴포넌트로 전달 */}
          <ReBoardHeader
            board={board}
            b_no={b_no}
            page={listPage}
            commentCount={comments.length}
            hasComments={comments.length > 0}
          />

          <section>
            {/* 
              주의:
              board.b_content가 HTML 문자열일 경우 XSS 방어가 필요할 수 있음.
              서버 또는 프론트에서 sanitize 처리 검토 필요.
            */}
            <div dangerouslySetInnerHTML={{ __html: board.b_content }} />
          </section>

          <hr style={{ height: '2px' }} />

          {/* 댓글 작성 영역 */}
          <div>
            <h3>댓글작성</h3>

            <input
              id="dataset-writer"
              type="text"
              maxLength={20}
              placeholder="작성자를 입력하세요."
              value={bcWriter}
              style={{
                width: '200px',
                height: '40px',
                border: '1px solid lightgray',
                borderRadius: '10px',
                padding: '5px',
              }}
              onChange={(e) => setBcWriter(e.target.value)}
            />

            <div style={{ margin: '10px 0' }} />

            <div style={{ display: 'flex' }}>
              <textarea
                style={{
                  width: '100%',
                  resize: 'none',
                  border: '1px solid lightgray',
                  borderRadius: '10px',
                  padding: '5px',
                  minHeight: '80px',
                }}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요."
              />
              <BButton
                style={{ height: '60px', marginLeft: '10px' }}
                onClick={commentInsert}
              >
                작성
              </BButton>
            </div>
          </div>

          <hr style={{ height: '2px' }} />

          {/* 댓글 목록 */}
          <div>
            {comments.length === 0 ? (
              <div>등록된 댓글이 없습니다.</div>
            ) : (
              comments.map((item) => (
                <div
                  key={item.bc_no}
                  style={{
                    borderBottom: '1px solid #e5e5e5',
                    padding: '12px 0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        fontSize: '16px',
                      }}
                    >
                      <span>작성일 : {item.bc_date}</span>
                      <span>작성자 : {item.bc_writer}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {editingCommentNo === item.bc_no ? (
                        <>
                          <BButton onClick={() => commentUpdate(item.bc_no)}>
                            저장
                          </BButton>
                          <BButton onClick={cancelEditComment}>취소</BButton>
                        </>
                      ) : (
                        <>
                          <BButton onClick={() => startEditComment(item)}>
                            수정
                          </BButton>
                          <BButton onClick={() => commentDelete(item.bc_no)}>
                            삭제
                          </BButton>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    {editingCommentNo === item.bc_no ? (
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        style={{
                          width: '100%',
                          resize: 'vertical',
                          border: '1px solid lightgray',
                          borderRadius: '10px',
                          padding: '8px',
                          minHeight: '80px',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          whiteSpace: 'pre-wrap',
                          padding: '8px',
                          backgroundColor: '#fafafa',
                          borderRadius: '8px',
                        }}
                      >
                        {item.bc_comment}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </FormDiv>
      </div>

      <FooterTrip />
    </>
  )
}

export default ReBoardDetail