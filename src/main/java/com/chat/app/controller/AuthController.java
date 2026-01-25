package com.chat.app.controller;

import com.chat.app.dto.UserRegistrationDTO;
import com.chat.app.model.User;
import com.chat.app.model.UserStatus;
import com.chat.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public String registerUser(@ModelAttribute UserRegistrationDTO registrationDTO) {
        if (userRepository.findByUsername(registrationDTO.getUsername()).isPresent()) {
            return "redirect:/register.html?error";
        }

        User user = User.builder()
                .username(registrationDTO.getUsername())
                .password(passwordEncoder.encode(registrationDTO.getPassword()))
                .status(UserStatus.OFFLINE)
                .avatarUrl("https://ui-avatars.com/api/?name=" + registrationDTO.getUsername() + "&background=random")
                .build();

        userRepository.save(user);

        return "redirect:/login.html?registered";
    }
}
