package com.example.demo.service;

import com.example.demo.dao.AdminDao;
import com.example.demo.dao.MemberDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Log4j2
@Service
@RequiredArgsConstructor
public class AdminService {
    private final AdminDao adminDao;
    private final MemberDao memberDao;

    public List<Map<String, Object>> getAllMembers(Map<String, Object> map) {
        List<Map<String, Object>> mList = null;
        mList = memberDao.memberList(map);
        return mList;
    }
}
