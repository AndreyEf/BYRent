package com.rentflow.repository;

import com.rentflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByVisibleId(String visibleId);
    boolean existsByEmail(String email);
    boolean existsByVisibleId(String visibleId);
    boolean existsByPhone(String phone);
    Optional<User> findByPhone(String phone);
    boolean existsByUnp(String unp);
    Optional<User> findByUnp(String unp);
}
