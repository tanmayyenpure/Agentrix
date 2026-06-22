package com.flowforge.repository;

import com.flowforge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByInviteToken(String inviteToken);
    boolean existsByEmail(String email);
}
