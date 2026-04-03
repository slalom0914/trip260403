package com.example.demo.auth;

import java.util.Collection;
import java.util.List;

import com.example.demo.model.Member;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Data
public class LoginMember implements UserDetails {

    private final String member_id;
    private final String email;
    private final String password;
    private final String role;
    private final boolean enabled;

    public LoginMember(Member member) {
        this.member_id = member.getMember_id();
        this.email = member.getEmail();
        this.password = member.getPassword();
        String r = member.getRole();
        this.role = (r != null && !r.isBlank()) ? r.trim() : Role.ROLE_MEMBER.name();
        this.enabled = isActiveMemberStatus(member.getStatus());
    }

    /** 회원 PK (member_id). UserDetails와 별도로 서비스에서 식별자로 사용 */
    public String getId() {
        return member_id;
    }

    /** status: ACTIVE 등(테이블 정의서 기준)일 때만 로그인 허용 */
    private static boolean isActiveMemberStatus(String status) {
        if (status == null || status.isBlank()) {
            return false;
        }
        return "ACTIVE".equalsIgnoreCase(status.trim());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}
