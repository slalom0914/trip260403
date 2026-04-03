import React, { useCallback, useRef, useState } from 'react'
import HeaderTrip from '../include/HeaderTrip'
import FooterTrip from '../include/FooterTrip'
import styles from './reboard.module.css'
import QuillEditor from './QuillEditor'
import { useNavigate } from 'react-router-dom'
import { boardInsertDB } from '../../service/boardLogic'
import { BButton } from '../../styles/FormStyles'

const ReBoardWrite = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('') //제목을 쓸 때 마다.  - 키보드 눌렸다가 떼어질때 마다. 상태가 변함.
  const [content, setContent] = useState('')
  const [writer, setWriter] = useState('')  
  const quillRef = useRef(null)
  const boardInsert = async () => {
    if(title.trim()==='' || content.trim()===''){
      alert('게시글이 작성되지 않았습니다.');
      return;
  }
  const board = {
      b_title: title, 
      b_writer: writer,
      b_content: content,
  }
  const res = await boardInsertDB(board)
  if(!res.data) alert('게시판 글쓰기에 실패하였습니다.')
  navigate('/reboard?page=1')
  }
  const handleTitle = (value) => {
    setTitle(value)
  }
  const handleWriter = (value) => {
    setWriter(value)
  }
  const handleContent = useCallback((e) => {
    setContent(e) //훅 상태값이 변한다. -> 변할 때 마다 ReBoardWrite()호출된다.-> 그 때마다 함수도 새로 생성됨.
  }, [])  
  return (
    <>
      <HeaderTrip />
      <div className="container">
        <div className={styles.pageHeader}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom:'5px'}}>
          <h2>글쓰기<small> - Quill Editor</small></h2>
            <BButton style={{marginLeft:'10px'}} onClick={boardInsert}>글쓰기</BButton>
          </div>
          <hr />
        </div>
        <div className="row">
          <div className="col-sm-12">
            <div style={{width:"100%", maxWidth:"2000px"}}>
              <div style={{display: 'flex', justifyContent: 'flex-start', marginBottom:'5px'}}>
                <span className={styles.writeTitleLabel}>제목</span> 
                <input id="dataset-title" type="text" maxLength="50" placeholder="제목을 입력하세요."
              className={styles.writeTitleInput} onChange={(e)=>{handleTitle(e.target.value)}}/>
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-start', marginBottom:'5px', marginTop:'5px'}}>
                <span className={styles.writeWriterLabel}>작성자</span> 
              <input id="dataset-writer" type="text" maxLength="20" placeholder="작성자를 입력하세요."
              className={styles.writeWriterInput} value={writer} onChange={(e)=>{handleWriter(e.target.value)}}/>
              </div>

              <hr style={{margin:'10px 0px 10px 0px'}}/>

              <div className="card text-center">
                <div className="card-header">
                  <ul className="nav nav-tabs card-header-tabs">
                    <li className="nav-item">
                      <a className="nav-link active" aria-current="true" href="#">상세내용</a>
                    </li>
                  </ul>
                </div>
                <div className="card-body">
                <QuillEditor value={content} handleContent={handleContent} quillRef={quillRef} />
                </div>
              </div>

              </div> 
            </div>
        </div>
      </div>
      <FooterTrip />
    </>
  )
}

export default ReBoardWrite