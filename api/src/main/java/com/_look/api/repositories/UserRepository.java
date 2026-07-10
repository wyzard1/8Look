package com._look.api.repositories;

import com._look.api.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
public User findByEmail(String email);
}
