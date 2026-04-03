import React from 'react'
import { Link } from 'react-router-dom'
const ReBoardItem = (props) => {
  console.log(props);
  const { b_no, b_title, b_writer, b_date, b_hit, listSearch } = props
  const detailTo = listSearch ? `/reboard/${b_no}?${listSearch}` : `/reboard/${b_no}`
  return (
    <>
      <tr>
        <td>{b_no}</td>
        <td>
        {/* <Route path="/notice/:n_no" exact={true} element={<NoticeDetail />}/> */}
        <Link to={detailTo} className='btn btn-primary'>{b_title}</Link>
        </td>
        <td>{b_writer}</td>
        <td>{b_date}</td>
      </tr>
    </>
  )
}

export default ReBoardItem