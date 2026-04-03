import { Navigate } from "react-router-dom";

const PrivateRouter = ({role, children, allowedRoles }) => {
  const userRole = role
  console.log("유저 역할"+role);
  console.log(allowedRoles);

  if (allowedRoles.includes(userRole)) {
    return children;
  } else {
    // 허용되지 않은 경우, 예를 들어 로그인 페이지나 접근 제한 페이지로 리다이렉트할 수 있습니다.
    return <Navigate to="/error" replace />;
  }
}

export default PrivateRouter