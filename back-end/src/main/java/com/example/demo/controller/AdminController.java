package com.example.demo.controller;

import com.example.demo.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Log4j2
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;
    @GetMapping("/getAllMembers")
    public List<Map<String, Object>> getAllMembers(
            @RequestParam(required = false) Map<String, String> queryParams) {
        log.info("getAllMembers query={}", queryParams);
        Map<String, Object> params = new HashMap<>();
        if (queryParams != null) {
            params.putAll(queryParams);
        }
        return adminService.getAllMembers(params);
    }
}
