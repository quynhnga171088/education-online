package com.lms.repository;

import com.lms.entity.BankInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BankInfoRepository extends JpaRepository<BankInfo, Integer> {
}
