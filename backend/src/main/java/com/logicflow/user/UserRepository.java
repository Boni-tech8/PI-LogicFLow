package com.logicflow.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByTelefone(String telefone);
    boolean existsByTelefone(String telefone);
}