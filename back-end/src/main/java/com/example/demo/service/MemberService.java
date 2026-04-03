package com.example.demo.service;

import com.example.demo.dao.MemberDao;
import com.example.demo.dto.LoginRequest;
import com.example.demo.model.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Log4j2
@Service
@RequiredArgsConstructor
public class MemberService {
    private final BCryptPasswordEncoder   bCryptPasswordEncoder;
    private final MemberDao memberDao;

    @Value("${app.upload-path}")
    private String uploadPath;

    public Member oauthCreate(String socialId, String name, String password
            , String email, String socialType) {
        log.info("oauthCreate");
        Member pmVO = Member.builder()
                .name(name)
                .nickname(name)
                .password(password)
                .email(email)
                .member_id(socialId)
                .social_type(socialType)
                .role("ROLE_MEMBER")
                .status("active")
                .build();
        memberDao.memberInsert(pmVO);
        return pmVO;
    }

    public List<Map<String, Object>> memberList(Map<String, Object> map) {
        List<Map<String, Object>> mList = null;
        mList = memberDao.memberList(map);
        return mList;
    }

    public Map<String, Object> memberDetail(Map<String, Object> map) {
        Map<String, Object> mMap = null;
        mMap = memberDao.memberDetail(map);
        return mMap;
    }

    public boolean existsByNickname(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return false;
        }
        return memberDao.existsByNickname(nickname.trim());
    }

    @Transactional(rollbackFor = Exception.class)
    public int memberInsert(Member member) {
        return memberInsert(member, null);
    }

    /**
     * 회원 등록. {@code profileImage}가 있으면 {@code app.upload-path} 아래에 저장하고
     * 저장 파일명을 {@link Member#getProfile_image()}에 설정한 뒤 INSERT합니다.
     */
    @Transactional(rollbackFor = Exception.class)
    public int memberInsert(Member member, MultipartFile profileImage) {
        log.info("memberInsert");
        if (profileImage != null && !profileImage.isEmpty()) {
            try {
                member.setProfile_image(storeProfileImage(profileImage));
            } catch (IOException e) {
                log.error("프로필 이미지 저장 실패", e);
                throw new IllegalStateException("프로필 이미지 저장에 실패했습니다.", e);
            }
        }
        member.setPassword(bCryptPasswordEncoder.encode(member.getPassword()));
        log.info(member);
        return memberDao.memberInsert(member);
    }

    private String storeProfileImage(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new IllegalArgumentException("파일 크기는 5MB 이하여야 합니다.");
        }
        Path dir = Paths.get(uploadPath.trim());
        Files.createDirectories(dir);

        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
            if (ext.length() > 12) {
                ext = "";
            }
        }
        String storedName = UUID.randomUUID() + ext;

        Path target = dir.resolve(storedName).normalize();
        if (!target.startsWith(dir.normalize())) {
            throw new IllegalArgumentException("잘못된 파일 경로입니다.");
        }
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        return storedName;
    }

    public int memberUpdate(Map<String, Object> map) {
        int result = 0;
        result = memberDao.memberUpdate(map);
        return result;
    }

    public int memberDelete(Map<String, Object> map) {
        int result = 0;
        result = memberDao.memberDelete(map);
        return result;
    }

    public Member getMemberEmail(LoginRequest loginRequest) {
        log.info("getMemberEmail");
        Member member = memberDao.getMemberEmail(loginRequest);
        return member;
    }//end of getMemberEmail
    public Member getMemberId(LoginRequest loginRequest) {
        log.info("getMemberId");
        Member member = memberDao.getMemberId(loginRequest);
        return member;
    }//end of getMemberEmail

    public Member getMemberByMemberId(String memberId) {
        return memberDao.findMemberByMemberId(memberId);
    }

}
