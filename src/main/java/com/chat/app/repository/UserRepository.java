package com.chat.app.repository;

import com.chat.app.model.User;
import com.chat.app.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    List<User> findByStatus(UserStatus status);
}
