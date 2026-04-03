package com.example.demo.dao;

import com.example.demo.dto.LoginRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Member;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Log4j2
@Repository
@RequiredArgsConstructor
public class MemberDao {
    private static final String NS = "com.mybatis.mapper.MemberMapper.";

    private final SqlSessionTemplate sqlSession;

    public List<Map<String, Object>> memberList(Map<String, Object> map) {
        return sqlSession.selectList(NS + "memberList", map);
    }

    public Map<String, Object> memberDetail(Map<String, Object> map) {
        return sqlSession.selectOne(NS + "memberDetail", map);
    }

    public boolean existsByEmail(String email) {
        Map<String, Object> param = new HashMap<>();
        param.put("email", email);
        String member_id = sqlSession.selectOne(NS + "existsByEmail", param);
        return member_id != null;
    }

    public boolean existsByNickname(String nickname) {
        log.info("existsByNickname : " +  nickname);
        Map<String, Object> param = new HashMap<>();
        param.put("nickname", nickname);
        String member_id = sqlSession.selectOne(NS + "existsByNickname", param);
        return member_id != null;
    }

    public int memberInsert(Member member) {
        log.info("memberInsert : "+member);
        int result = 0;
        result = sqlSession.insert(NS + "memberInsert", member);
        return result;
    }

    public int memberUpdate(Map<String, Object> map) {
        return sqlSession.update(NS + "memberUpdate", map);
    }

    public int memberDelete(Map<String, Object> map) {
        return sqlSession.delete(NS + "memberDelete", map);
    }

    public Member findByEmail(String email) {
        Map<String, Object> param = new HashMap<>();
        param.put("email", email);
        return sqlSession.selectOne(NS + "findByEmail", param);
    }

    /** MyBatis: member.xml findMemberByMemberId (#{member_id}) */
    public Member findMemberByMemberId(String memberId) {
        Map<String, Object> param = new HashMap<>();
        param.put("member_id", memberId);
        return sqlSession.selectOne(NS + "findMemberByMemberId", param);
    }

    public Map<String, Object> selectMemberByMemberId(String memberId) {
        Map<String, Object> param = new HashMap<>();
        param.put("member_id", memberId);
        return sqlSession.selectOne(NS + "selectMemberByMemberId", param);
    }

    public List<Map<String, Object>> selectAllMembersForAdmin() {
        return sqlSession.selectList(NS + "selectAllMembersForAdmin");
    }

    public int updateMemberRole(String memberId, String role) {
        Map<String, Object> param = new HashMap<>();
        param.put("member_id", memberId);
        param.put("role", role);
        return sqlSession.update(NS + "updateMemberRole", param);
    }

    public Member getMemberEmail(LoginRequest loginRequest) {
        Member rmember = sqlSession.selectOne(NS + "getMemberEmail", loginRequest);
        log.info(rmember);
        return rmember;
    }
    public Member getMemberId(LoginRequest loginRequest) {
        log.info("getMemberId : " +  loginRequest);
        Member rmember = sqlSession.selectOne(NS + "getMemberId", loginRequest);
        log.info(rmember);
        return rmember;
    }

}
