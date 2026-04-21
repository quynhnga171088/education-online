package com.lms.repository;

import com.lms.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Integer> {

    Optional<SystemConfig> findByKey(String key);

    boolean existsByKey(String key);
}
