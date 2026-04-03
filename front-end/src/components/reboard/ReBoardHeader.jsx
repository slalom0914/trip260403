import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { boardDeleteDB } from '../../service/boardLogic'
import { BButton } from '../../styles/FormStyles'

const ReBoardHeader = ({ board, b_no, page = 1, commentCount, hasComments }) => {
  const navigate = useNavigate()
  const[b_hit, setBhit] = useState(0)
  //boardDetail한 뒤 조회수가 1 증가된 결과가 즉시 화면에 반영되도록 수정할 때
  //리액트에서는 state가 변하면 새로 렌더링 한다.
  useEffect(() => {
      setBhit(board.B_HIT)
  },[board])
  /**
   * 원글 삭제
   * 댓글이 있으면 삭제 불가
   */  
  const boardDelete = async () => {
    // 1. 댓글 존재 여부 먼저 검사
    if (hasComments || commentCount > 0) {
      alert('댓글이 있는 게시글은 삭제할 수 없습니다. 댓글을 먼저 삭제하세요.')
      return
    }

    // 2. 사용자 삭제 확인
    const isConfirmed = window.confirm('정말 삭제하시겠습니까?')
    if (!isConfirmed) {
      return
    }    
    try {
      const res = await boardDeleteDB(b_no)

      // 백엔드가 1 또는 "1" 반환한다고 가정
      if (String(res?.data) === '1') {
        alert('게시글이 삭제되었습니다.')
        navigate(`/reboard?page=${page}`, { replace: true })
      } else {
        alert('게시글 삭제에 실패했습니다.')
      }
    } catch (e) {
      console.error(e)
      alert('삭제에 실패했습니다.')
    }
  }
  const boardList = () => {
      navigate(`/reboard?page=${page}`)
  }
  return (
    <>
      <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
        <div style={{display: 'flex', justifyContent:"space-between"}}>
        <div style={{overflow: "auto"}}>
          <span style={{marginBottom:'15px', fontSize: "30px", display:"block"}}>
          {board.b_title}
          </span>
        </div>
        {
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <BButton style={{margin:'0px 10px 0px 10px'}} onClick={()=>{navigate(`/reboard/update/${b_no}`)}}>
              수정
          </BButton>
          <BButton style={{margin:'0px 10px 0px 10px'}} onClick={boardDelete}>
              삭제
          </BButton>
          <BButton style={{margin:'0px 10px 0px 10px'}} onClick={boardList}>
              목록
          </BButton>
          </div>
        }
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <span>작성자 : {board.b_writer}</span>
          <span>작성일 : {board.b_date}</span>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', marginRight:'10px'}}>
          <div style={{display: 'flex'}}>
          <span style={{marginRight:'5px'}}>조회수 :</span>
          <div style={{display: 'flex', justifyContent: 'flex-end', width:'30px'}}>{board.b_hit}</div>
          </div>
          <div style={{display: 'flex'}}>
          <span style={{marginRight:'5px'}}>댓글 수 :</span>
          <div style={{display: 'flex', justifyContent: 'flex-end', width:'30px'}}>{commentCount}</div>
          </div>
          <div style={{display: 'flex'}}>
          <span style={{marginRight:'5px'}}>댓글 존재 여부 :</span>
          <div style={{display: 'flex', justifyContent: 'flex-end', width:'30px'}}>{hasComments ? '있음' : '없음'}</div>
          </div>
        </div>
        </div>
      </div>      
      <hr style={{height: "2px"}}/>
    </>
  )
}

export default ReBoardHeader