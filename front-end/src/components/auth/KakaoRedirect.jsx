import React, { useEffect } from 'react'
import { kakaoLoginApi } from '../../service/authApi'
import { useNavigate } from 'react-router'

const KakaoRedirect = () => {
  const navigate = useNavigate()
  const code = new URL(window.location.href).searchParams.get('code')
  console.log(code)
  useEffect(()=>{
    const kakaoLogin = async() => {
      const data = await kakaoLoginApi({ code: code })
      console.log(data)
      const member_id = data.member_id
      const accessToken = data.accessToken
      const refreshToken = data.refreshToken
      const email = data.email
      const name = data.name
      const role = data.role
      const profile_image = data.profile_image
      const social_type = data.social_type ?? 'KAKAO'
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
    }
    kakaoLogin()
  },[])
  return (
    <>
      loading ...
    </>
  )
}

export default KakaoRedirect