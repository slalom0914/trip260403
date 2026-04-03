import React, { useEffect } from 'react'
import { useNavigate } from 'react-router';
import { naverLoginApi } from '../../service/authApi';

const NaverRedirect = () => {
  const navigate = useNavigate();
  const code = new URL(window.location.href).searchParams.get('code')
  console.log(code);
  useEffect(() => {
    const naverLogin = async() => {
      const data = await naverLoginApi({ code: code })
      console.log(data)
      const token = data.token
      const email = data.email
      const name = data.name
      console.log("Access Token : "+token)
      localStorage.setItem("token", token)
      localStorage.setItem("email", email)
      localStorage.setItem("name", name)
      if(token){
        navigate("/home")
      }else{
        alert("Access Token이 없습니다.")
      }
    }
    naverLogin()
  },[])
  return (
    <>
      loading ...
    </>
  )
}

export default NaverRedirect