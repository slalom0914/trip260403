import React, { useCallback, useEffect, useRef, useState } from 'react'
import HeaderTrip from '../include/HeaderTrip'
import { BButton, ContainerDiv, FormDiv, HeaderDiv } from '../../styles/FormStyles'
import QuillEditor from './QuillEditor'
import FooterTrip from '../include/FooterTrip'
import { useNavigate, useParams } from 'react-router'
import { boardDetailDB, boardUpdateDB } from '../../service/boardLogic'
//-> http://localhost:3000/reboard/update/:b_no
const ReBoardUpdate = () => {
  const navigate = useNavigate()
  //쿼리 스트링이 아니라 hash값으로 받아오기
  const { b_no } = useParams()
  console.log(b_no) //사용자가 선택한 글 번호
  const [title, setTitle] = useState('')// 사용자가 수정하는 제목 담기
  const [content, setContent] = useState('') //사용자가 수정하는 내용 담기
  const [writer, setWriter] = useState('') 
  const quillRef = useRef()

  // 글 번호(b_no)가 바뀔 때만 서버에서 기존 글을 한 번 불러온다.
  // title/content/writer를 의존성에 넣으면 입력할 때마다 effect가 다시 돌아가
  // 방금 입력한 값이 상세 조회 결과로 덮어씌워진다.
  useEffect(() => {
    const asyncDB = async () => {
      const res = await boardDetailDB(b_no)
      console.log(res.data[0])
      setTitle(res.data[0].b_title)
      setContent(res.data[0].b_content)
      setWriter(res.data[0].b_writer)
    }
    asyncDB()
  }, [b_no])
  //함수를 메모이제이션 처리할 때 useCallback훅을 사용한다.
  //BoardDBUpdate는 함수이지만 return에서 멀티 엘리먼트를 갖고 있어서 화면 출력함.
  //이 함수는 props나 state가 변하면 새로 렌더링을 한다.
  //새로 렌더링이 일어날 때 마다 함수가 매번 새로 만들어진다. - 비효율적
  //메모이제이션 처리한다.
  //QuillEditor.jsx - 수정되는 부분도 ReBoardDBUpdate의 자손 객체 이므로
  //부모가 변하면 자손도 새로 렌더링이 일어난다.
  //언제(어떤 이벤트가 발동) 호출되는 함수인가? - 
  const handleTitle = useCallback((value) => {
    setTitle(value)
  }, [])
  const handleWriter = useCallback((value) => {
    setWriter(value)
  }, [])
  const handleContent = useCallback((value) => {
    setContent(value)
  }, [])
  const boardUpdate = async() => {//실제 수정버튼이 눌렸을 때 호출
    const board = {
      b_no:b_no, //조건절에 들어가는 고정값 -  b_no가 같은 값에 대해서만 수정하기
      b_title: title, //키와 값이 다른 경우는 생략이 불가함.
      b_writer: writer,
      b_content: content
    }
    const res = await boardUpdateDB(board)
    if (res?.data == 1) {
      //수정이 성공하면 목록페이지를 출력한다.
      //목록 페이지로 이동하는 URL요청에서 쿼리스트링으로 붙은 page=1값은
      //목록 페이지 처리할 때 현재 내가 있었던 위치를 기억하는 값이어야 한다.
      //후처리가 필요하다.
      navigate('/reboard?page=1')
    }else{//수정이 실패한 경우
      console.log("수정 실패하였습니다.")
    }
  }//end of boardUpdate
  return (
    <>
      <HeaderTrip />
        <ContainerDiv>
          <HeaderDiv>
            <h3>게시글 수정</h3>
          </HeaderDiv>
          <FormDiv>
            <div style={{width:"100%", maxWidth:"2000px"}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'5px'}}>
                  <h2>제목</h2> 
                  <div style={{display: 'flex'}}>
                      <BButton style={{marginLeft:'10px'}}onClick={boardUpdate}>글수정</BButton>
                  </div>
              </div>
              <input id="dataset-title" type="text" maxLength="50" placeholder="제목을 입력하세요." value={title}
              style={{width:"100%",height:'40px' , border:'1px solid lightGray'}} onChange={(e)=>{handleTitle(e.target.value)}}/>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'5px', marginTop:'5px'}}>
                  <h2>작성자</h2> 
              </div>
              <input id="dataset-writer" type="text" maxLength="20" placeholder="작성자를 입력하세요." value={writer}
              style={{width:"200px",height:'40px' , border:'1px solid lightGray'}} onChange={(e)=>{handleWriter(e.target.value)}}/>
              <hr style={{margin:'10px 0px 10px 0px'}}/>
              <h3>상세내용</h3>
              <QuillEditor value={content} handleContent={handleContent} quillRef={quillRef} />
            </div>            
          </FormDiv>
        </ContainerDiv>
      <FooterTrip />    
    </>
  )
}

export default ReBoardUpdate