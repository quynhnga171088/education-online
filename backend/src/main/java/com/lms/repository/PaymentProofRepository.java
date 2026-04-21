package com.lms.repository;

import com.lms.entity.Enrollment;
import com.lms.entity.PaymentProof;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentProofRepository extends JpaRepository<PaymentProof, Long> {

    Optional<PaymentProof> findByEnrollment(Enrollment enrollment);

    boolean existsByEnrollment(Enrollment enrollment);
}
