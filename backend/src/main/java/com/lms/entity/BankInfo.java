package com.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bank_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "bank_name", nullable = false, length = 255)
    private String bankName;

    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;

    @Column(name = "account_name", nullable = false, length = 255)
    private String accountName;

    @Column(length = 255)
    private String branch;

    @Column(name = "transfer_template", columnDefinition = "TEXT")
    private String transferTemplate;

    @Column(name = "qr_image_url", columnDefinition = "TEXT")
    private String qrImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
