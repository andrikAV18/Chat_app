package com.chat.app.config;

import com.chat.app.model.User;
import com.chat.app.model.UserStatus;
import com.chat.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        .status(UserStatus.ONLINE)
                        .avatarUrl("https://ui-avatars.com/api/?name=Admin&background=random")
                        .build();
                userRepository.save(admin);
            }
            if (userRepository.findByUsername("user").isEmpty()) {
                User user = User.builder()
                        .username("user")
                        .password(passwordEncoder.encode("user"))
                        .status(UserStatus.OFFLINE)
                        .avatarUrl("https://ui-avatars.com/api/?name=User&background=random")
                        .build();
                userRepository.save(user);
            }
        };
    }
}
