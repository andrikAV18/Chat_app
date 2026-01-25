package com.chat.app.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    @GetMapping("/current-user")
    public Map<String, String> getCurrentUser(Principal principal) {
        Map<String, String> map = new HashMap<>();
        map.put("username", principal.getName());
        return map;
    }
}
