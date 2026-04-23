package com.lms.dto.enrollment;

import com.lms.entity.PaymentProof;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentProofResponse {
    private Long id;
    private String imageUrl;
    private String note;
    private LocalDateTime createdAt;

    public static PaymentProofResponse fromEntity(PaymentProof p) {
        return PaymentProofResponse.builder()
                .id(p.getId())
                .imageUrl(p.getImageUrl())
                .note(p.getNote())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
