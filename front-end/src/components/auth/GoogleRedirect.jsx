import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { googleLoginApi } from '../../service/authApi'

const GoogleRedirect = () => {
  const navigate = useNavigate()
  // 구글에서 보내주는 인가코드 받기
  // 구글에서 5173번 서버로 응답을 보낼 때 ?code=12345678
  const code = new URL(window.location.href).searchParams.get('code')
  console.log(code) //12345678
  useEffect(() => {
    const googleLogin = async() => {
      const data = await googleLoginApi({ code: code })
      //스프링 부트에서 보내준 Access Token 이다.
      console.log(data)
      const member_id = data.member_id
      const accessToken = data.accessToken
      const refreshToken = data.refreshToken
      const email = data.email
      const name = data.name
      const role = data.role
      const profile_image = data.profile_image ?? data.picture
      const social_type = data.social_type ?? 'GOOGLE'
      localStorage.setItem("member_id", member_id)
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("email", email)
      localStorage.setItem("name", name)
      localStorage.setItem("role", role)
      localStorage.setItem("profile_image", profile_image)
      localStorage.setItem("social_type", social_type)
      if(accessToken){
        window.dispatchEvent(new Event('trip-auth-profile-updated'))
        navigate('/home', { replace: true })
      }else{
        alert("Access Token이 없습니다.")
      }
    }//end of googleLogin
    googleLogin()
  },[])
  return (
    <>
      loading ...
    </>
  )
}

export default GoogleRedirect